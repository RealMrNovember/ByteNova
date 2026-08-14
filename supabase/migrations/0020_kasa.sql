-- =============================================================
-- ByteNova — 0020_kasa
-- Kasa hesapları (nakit/banka/POS) + hareketler, satışların kasaya
-- bağlanması, servis kapanışında tahsilat + kapora/avans + mahsup.
-- =============================================================

-- ---------- KASA HESAPLARI ----------

create table public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null check (type in ('nakit', 'banka', 'pos')),
  balance numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index cash_accounts_tenant_idx on public.cash_accounts (tenant_id, is_active);

alter table public.cash_accounts enable row level security;

create policy "cash_accounts_select" on public.cash_accounts
  for select using (tenant_id = public.current_tenant_id());

create policy "cash_accounts_insert" on public.cash_accounts
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner', 'manager')
  );

create policy "cash_accounts_update" on public.cash_accounts
  for update using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner', 'manager')
  );

-- ---------- KASA HAREKETLERİ ----------

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_id uuid not null references public.cash_accounts(id) on delete restrict,
  movement_type text not null check (movement_type in (
    'tahsilat', 'odeme', 'transfer_giris', 'transfer_cikis', 'acilis', 'duzeltme'
  )),
  amount numeric(12,2) not null,               -- işaretli: + para girişi, - para çıkışı
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  reference_type text,
  reference_id text,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index cash_movements_account_idx on public.cash_movements (account_id, created_at desc);
create index cash_movements_tenant_idx on public.cash_movements (tenant_id, created_at desc);

alter table public.cash_movements enable row level security;

create policy "cash_movements_select" on public.cash_movements
  for select using (tenant_id = public.current_tenant_id());

-- İçeri yazma yalnız aşağıdaki RPC üzerinden olur (stok_hareketi_ekle ile aynı desen).

create or replace function public.kasa_hareketi_ekle(
  p_account_id uuid,
  p_degisim numeric,
  p_tip text,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_neden text default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_once numeric;
  v_sonra numeric;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select balance into v_once
  from public.cash_accounts
  where id = p_account_id and tenant_id = v_tenant and is_active = true
  for update;

  if not found then
    raise exception 'kasa hesabı bulunamadı veya erişim yok';
  end if;

  v_sonra := v_once + p_degisim;

  update public.cash_accounts
  set balance = v_sonra
  where id = p_account_id;

  insert into public.cash_movements
    (tenant_id, account_id, movement_type, amount, balance_before, balance_after,
     reference_type, reference_id, reason, created_by)
  values
    (v_tenant, p_account_id, p_tip, p_degisim, v_once, v_sonra,
     p_referans_tip, p_referans_id, p_neden, auth.uid());

  return v_sonra;
end;
$$;

-- ---------- SATIŞ ÖDEMELERİ → KASA ----------
-- Her ödeme satırı artık hangi kasa hesabına girdiğini taşır
-- (açık hesap hariç — o an kasaya para girmez, cari borç doğar).

alter table public.sale_payments
  add column account_id uuid references public.cash_accounts(id) on delete restrict;

create or replace function public.satis_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,           -- [{item_type, product_id, name, quantity, unit_price, discount_amount}]
  p_odemeler jsonb,           -- [{method, amount, installments, account_id}]
  p_genel_iskonto numeric default 0,
  p_yuvarlama numeric default 0,
  p_iskonto_onaylayan_id uuid default null,
  p_negatif_onay boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_sale_id uuid;
  v_indirimsiz_toplam numeric := 0;
  v_satir_iskonto_toplami numeric := 0;
  v_subtotal numeric := 0;
  v_toplam numeric := 0;
  v_iskonto_yuzde numeric := 0;
  v_odeme_toplami numeric := 0;
  v_odeme_yontemi text;
  v_yontem_sayisi int;
  v_kalem record;
  v_odeme record;
  v_max_taksit int;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select coalesce(sum(quantity * unit_price), 0),
         coalesce(sum(coalesce(discount_amount, 0)), 0)
    into v_indirimsiz_toplam, v_satir_iskonto_toplami
  from jsonb_to_recordset(p_kalemler)
    as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric, discount_amount numeric);

  if v_indirimsiz_toplam <= 0 then
    raise exception 'satışta en az bir geçerli kalem olmalı';
  end if;

  v_subtotal := v_indirimsiz_toplam - v_satir_iskonto_toplami;
  v_toplam := v_subtotal - coalesce(p_genel_iskonto, 0) + coalesce(p_yuvarlama, 0);

  if v_toplam < 0 then
    raise exception 'iskonto ve yuvarlama sonrası tutar negatif olamaz';
  end if;

  -- ---------- Rol bazlı iskonto limiti (yalnız kasiyer için — owner/manager sınırsız) ----------
  if public.rol_su() = 'cashier' then
    v_iskonto_yuzde := case when v_indirimsiz_toplam > 0
      then ((v_satir_iskonto_toplami + coalesce(p_genel_iskonto, 0)) / v_indirimsiz_toplam) * 100
      else 0 end;

    if v_iskonto_yuzde > 10 then
      if p_iskonto_onaylayan_id is null then
        raise exception 'ISKONTO_ONAY_GEREKLI: %.1f%% iskonto limitin üzerinde', v_iskonto_yuzde;
      end if;
      if not exists (
        select 1 from public.profiles
        where id = p_iskonto_onaylayan_id and tenant_id = v_tenant and role in ('owner', 'manager')
      ) then
        raise exception 'geçersiz onaylayan kullanıcı';
      end if;
    end if;
  end if;

  -- ---------- Ödemeler: yöntem, toplam, taksit ve kasa hesabı doğrulaması ----------
  select count(distinct method), coalesce(sum(amount), 0)
    into v_yontem_sayisi, v_odeme_toplami
  from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid);

  if v_yontem_sayisi is null or v_yontem_sayisi = 0 then
    raise exception 'en az bir ödeme kalemi olmalı';
  end if;

  if abs(v_odeme_toplami - v_toplam) > 0.01 then
    raise exception 'ödemeler toplamı (%) satış tutarına (%) eşit değil', v_odeme_toplami, v_toplam;
  end if;

  select max_installments into v_max_taksit from public.tenants where id = v_tenant;

  for v_odeme in select * from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid)
  loop
    if v_odeme.method not in ('nakit', 'kart', 'acik_hesap') then
      raise exception 'geçersiz ödeme yöntemi: %', v_odeme.method;
    end if;
    if v_odeme.method = 'acik_hesap' and p_musteri_id is null then
      raise exception 'açık hesap için müşteri seçilmeli';
    end if;
    if v_odeme.method <> 'acik_hesap' and v_odeme.account_id is null then
      raise exception 'kasa hesabı seçilmeli: %', v_odeme.method;
    end if;
    if v_odeme.installments is not null and v_odeme.installments > 1 then
      if v_odeme.method <> 'kart' then
        raise exception 'taksit yalnız kart ödemesinde geçerli';
      end if;
      if v_odeme.installments > v_max_taksit then
        raise exception 'TAKSIT_LIMITI_ASILDI: azami % taksit', v_max_taksit;
      end if;
    end if;
  end loop;

  v_odeme_yontemi := case when v_yontem_sayisi > 1 then 'karma'
    else (select method from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid) limit 1)
  end;

  insert into public.sales
    (tenant_id, customer_id, subtotal, discount_amount, rounding_amount, total_amount, payment_method, created_by)
  values
    (v_tenant, p_musteri_id, v_subtotal, coalesce(p_genel_iskonto, 0), coalesce(p_yuvarlama, 0), v_toplam, v_odeme_yontemi, auth.uid())
  returning id into v_sale_id;

  for v_kalem in
    select * from jsonb_to_recordset(p_kalemler)
      as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric, discount_amount numeric)
  loop
    if v_kalem.item_type not in ('urun', 'iscilik', 'hizmet') then
      raise exception 'geçersiz kalem tipi: %', v_kalem.item_type;
    end if;
    if v_kalem.quantity is null or v_kalem.quantity <= 0 then
      raise exception 'geçersiz miktar: %', v_kalem.name;
    end if;
    if v_kalem.unit_price is null or v_kalem.unit_price < 0 then
      raise exception 'geçersiz birim fiyat: %', v_kalem.name;
    end if;
    if coalesce(v_kalem.discount_amount, 0) > v_kalem.quantity * v_kalem.unit_price then
      raise exception 'satır iskontosu kalem tutarını aşamaz: %', v_kalem.name;
    end if;

    insert into public.sale_items
      (tenant_id, sale_id, item_type, product_id, name, quantity, unit_price, discount_amount, line_total)
    values
      (v_tenant, v_sale_id, v_kalem.item_type, v_kalem.product_id, v_kalem.name,
       v_kalem.quantity, v_kalem.unit_price, coalesce(v_kalem.discount_amount, 0),
       v_kalem.quantity * v_kalem.unit_price - coalesce(v_kalem.discount_amount, 0));

    if v_kalem.item_type = 'urun' and v_kalem.product_id is not null then
      perform public.stok_hareketi_ekle(
        v_kalem.product_id, -v_kalem.quantity, 'sale', 'sale', v_sale_id::text,
        'Satış: ' || v_kalem.name, p_negatif_onay
      );
    end if;
  end loop;

  for v_odeme in select * from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid)
  loop
    insert into public.sale_payments (tenant_id, sale_id, method, amount, installments, account_id)
    values (v_tenant, v_sale_id, v_odeme.method, v_odeme.amount, v_odeme.installments, v_odeme.account_id);

    if v_odeme.method <> 'acik_hesap' then
      perform public.kasa_hareketi_ekle(
        v_odeme.account_id, v_odeme.amount, 'tahsilat', 'sale', v_sale_id::text,
        'Satış tahsilatı'
      );
    end if;
  end loop;

  perform public.audit_ekle(
    'satis_olusturuldu', 'sale', v_sale_id::text, null,
    jsonb_build_object(
      'toplam', v_toplam, 'genel_iskonto', p_genel_iskonto, 'yuvarlama', p_yuvarlama,
      'odeme_yontemi', v_odeme_yontemi, 'iskonto_onaylayan_id', p_iskonto_onaylayan_id
    )
  );

  return v_sale_id;
end;
$$;

-- ---------- SERVİS TAHSİLATI (kapora/avans + kapanış, mahsup) ----------
-- Kapora her an alınabilir (service_orders.advance_paid'e eklenir).
-- Kapanış tahsilatı teslim sırasında kalan tutarı tahsil eder; kapora
-- zaten advance_paid'de tutulduğu için ekranda kalan = final_cost -
-- advance_paid olarak hesaplanır (mahsup budur — ayrı bir mekanizma
-- gerekmiyor).

create or replace function public.servis_tahsilat_al(
  p_service_id uuid,
  p_tutar numeric,
  p_tip text,          -- 'kapora' | 'kapanis'
  p_account_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_tip not in ('kapora', 'kapanis') then
    raise exception 'geçersiz tahsilat tipi';
  end if;
  if p_tutar <= 0 then
    raise exception 'tutar sıfırdan büyük olmalı';
  end if;
  if not exists (select 1 from public.service_orders where id = p_service_id and tenant_id = v_tenant) then
    raise exception 'servis bulunamadı veya erişim yok';
  end if;

  perform public.kasa_hareketi_ekle(
    p_account_id, p_tutar, 'tahsilat', 'service_order', p_service_id::text,
    case when p_tip = 'kapora' then 'Servis kaporası' else 'Servis kapanış tahsilatı' end
  );

  if p_tip = 'kapora' then
    update public.service_orders
    set advance_paid = advance_paid + p_tutar
    where id = p_service_id;
  end if;

  perform public.audit_ekle(
    p_tip || '_alindi', 'service_order', p_service_id::text, null,
    jsonb_build_object('tutar', p_tutar, 'account_id', p_account_id)
  );
end;
$$;
