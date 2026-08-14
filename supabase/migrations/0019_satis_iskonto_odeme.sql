-- =============================================================
-- ByteNova — 0019_satis_iskonto_odeme
-- İskonto (satır + genel + yuvarlama, rol limiti + yönetici onayı) ve
-- karma ödeme (nakit+kart) + taksit (tenant bazlı parametrik limit).
-- =============================================================

-- ---------- İSKONTO ALANLARI ----------

alter table public.sale_items
  add column discount_amount numeric(12,2) not null default 0;

alter table public.sales
  add column discount_amount numeric(12,2) not null default 0,
  add column rounding_amount numeric(12,2) not null default 0;

-- Karma ödeme artık ayrı bir tabloda tutulduğu için sales.payment_method
-- birden çok yöntem varsa 'karma' değerini de alabilmeli.
alter table public.sales drop constraint sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('nakit', 'kart', 'acik_hesap', 'karma'));

-- ---------- TAKSİT LİMİTİ (tenant ayarı, parametrik) ----------

alter table public.tenants
  add column max_installments int not null default 12 check (max_installments >= 1);

-- ---------- SATIŞ ÖDEMELERİ (karma ödeme: nakit+kart vb.) ----------

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  method text not null check (method in ('nakit', 'kart', 'acik_hesap')),
  amount numeric(12,2) not null check (amount > 0),
  installments int check (installments is null or installments >= 1),
  created_at timestamptz not null default now()
);

create index sale_payments_sale_idx on public.sale_payments (sale_id);

alter table public.sale_payments enable row level security;

create policy "sale_payments_select" on public.sale_payments
  for select using (tenant_id = public.current_tenant_id());

-- ---------- satis_olustur(): iskonto + karma ödeme + taksit destekli ----------
-- Önceki 4 parametreli sürüm (Gün 16) burada tamamen yerini alıyor;
-- overload çakışmasını önlemek için önce açıkça düşürülüyor
-- (bkz. Gün 15'teki stok_hareketi_ekle overload hatası — 0017).

drop function if exists public.satis_olustur(uuid, jsonb, text, boolean);

create or replace function public.satis_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,           -- [{item_type, product_id, name, quantity, unit_price, discount_amount}]
  p_odemeler jsonb,           -- [{method, amount, installments}]
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

  -- ---------- Ödemeler: yöntem, toplam ve taksit doğrulaması ----------
  select count(distinct method), coalesce(sum(amount), 0)
    into v_yontem_sayisi, v_odeme_toplami
  from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int);

  if v_yontem_sayisi is null or v_yontem_sayisi = 0 then
    raise exception 'en az bir ödeme kalemi olmalı';
  end if;

  if abs(v_odeme_toplami - v_toplam) > 0.01 then
    raise exception 'ödemeler toplamı (%) satış tutarına (%) eşit değil', v_odeme_toplami, v_toplam;
  end if;

  select max_installments into v_max_taksit from public.tenants where id = v_tenant;

  for v_odeme in select * from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int)
  loop
    if v_odeme.method not in ('nakit', 'kart', 'acik_hesap') then
      raise exception 'geçersiz ödeme yöntemi: %', v_odeme.method;
    end if;
    if v_odeme.method = 'acik_hesap' and p_musteri_id is null then
      raise exception 'açık hesap için müşteri seçilmeli';
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
    else (select method from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int) limit 1)
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

  for v_odeme in select * from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int)
  loop
    insert into public.sale_payments (tenant_id, sale_id, method, amount, installments)
    values (v_tenant, v_sale_id, v_odeme.method, v_odeme.amount, v_odeme.installments);
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
