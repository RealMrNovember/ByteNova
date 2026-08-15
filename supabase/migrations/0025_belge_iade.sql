-- =============================================================
-- ByteNova — 0025_belge_iade
-- Belge tipi (manuel ÖKC modu / sonra kesilecek kuyruğu) + iade akışı
-- (İade Alındı → Kontrol → Satılabilir/Arızalı/Hurda/Servise).
-- =============================================================

-- ---------- BELGE TİPİ ----------

alter table public.sales
  add column document_type text not null default 'sonra_kesilecek'
    check (document_type in ('okc_fisi', 'sonra_kesilecek')),
  add column receipt_no text,
  add column document_issued_at timestamptz;

-- satis_olustur(): belge tipi/fiş no eklendi. İmza değişiyor —
-- overload çakışmasını önlemek için önce açıkça düşürülüyor.

drop function if exists public.satis_olustur(uuid, jsonb, jsonb, numeric, numeric, uuid, boolean);

create or replace function public.satis_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,           -- [{item_type, product_id, name, quantity, unit_price, discount_amount}]
  p_odemeler jsonb,           -- [{method, amount, installments, account_id}]
  p_genel_iskonto numeric default 0,
  p_yuvarlama numeric default 0,
  p_iskonto_onaylayan_id uuid default null,
  p_negatif_onay boolean default false,
  p_belge_tipi text default 'sonra_kesilecek',
  p_fis_no text default null
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
  v_belge_kesildi_mi timestamptz;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if p_belge_tipi not in ('okc_fisi', 'sonra_kesilecek') then
    raise exception 'geçersiz belge tipi';
  end if;
  if p_belge_tipi = 'okc_fisi' and (p_fis_no is null or trim(p_fis_no) = '') then
    raise exception 'ÖKC fişi için fiş numarası zorunlu';
  end if;
  v_belge_kesildi_mi := case when p_belge_tipi = 'okc_fisi' then now() else null end;

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
    (tenant_id, customer_id, subtotal, discount_amount, rounding_amount, total_amount, payment_method,
     document_type, receipt_no, document_issued_at, created_by)
  values
    (v_tenant, p_musteri_id, v_subtotal, coalesce(p_genel_iskonto, 0), coalesce(p_yuvarlama, 0), v_toplam, v_odeme_yontemi,
     p_belge_tipi, nullif(trim(p_fis_no), ''), v_belge_kesildi_mi, auth.uid())
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
      'odeme_yontemi', v_odeme_yontemi, 'iskonto_onaylayan_id', p_iskonto_onaylayan_id,
      'belge_tipi', p_belge_tipi
    )
  );

  return v_sale_id;
end;
$$;

-- "Sonra kesilecek" satışın belgesini daha sonra kesme (kuyruk).

create or replace function public.satis_belgesini_kes(
  p_sale_id uuid,
  p_fis_no text
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
  if p_fis_no is null or trim(p_fis_no) = '' then
    raise exception 'fiş numarası zorunlu';
  end if;

  update public.sales
  set document_type = 'okc_fisi', receipt_no = trim(p_fis_no), document_issued_at = now()
  where id = p_sale_id and tenant_id = v_tenant and document_issued_at is null;

  if not found then
    raise exception 'satış bulunamadı veya belgesi zaten kesilmiş';
  end if;

  perform public.audit_ekle(
    'satis_belgesi_kesildi', 'sale', p_sale_id::text, null,
    jsonb_build_object('fis_no', trim(p_fis_no))
  );
end;
$$;

-- ---------- İADE NUMARASI SAYAÇLARI ----------
-- Format: IA-YYYY-NNNNNN (service_no/sale_no ile aynı desen)

create table public.return_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_iade_no(p_tenant_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  yil int := extract(year from now());
  sira int;
begin
  insert into public.return_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, yil, 1)
  on conflict (tenant_id, year)
  do update set last_no = return_no_counters.last_no + 1
  returning last_no into sira;

  return 'IA-' || yil || '-' || lpad(sira::text, 6, '0');
end;
$$;

-- ---------- İADELER ----------

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  return_no text not null,
  sale_id uuid not null references public.sales(id) on delete restrict,
  sale_item_id uuid not null references public.sale_items(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity numeric(12,2) not null check (quantity > 0),
  reason text,
  status text not null default 'alindi' check (status in ('alindi', 'kontrol_edildi')),
  inspection_result text check (inspection_result in ('satilabilir', 'arizali', 'hurda', 'servise')),
  refund_method text check (refund_method in ('nakit_iade', 'iade_yok')),
  refund_amount numeric(12,2),
  refund_account_id uuid references public.cash_accounts(id),
  service_order_id uuid references public.service_orders(id) on delete set null,
  received_by uuid references auth.users(id) on delete set null,
  received_at timestamptz not null default now(),
  inspected_by uuid references auth.users(id) on delete set null,
  inspected_at timestamptz
);

create unique index returns_no_unique on public.returns (tenant_id, return_no);
create index returns_tenant_idx on public.returns (tenant_id, status, received_at desc);
create index returns_sale_item_idx on public.returns (sale_item_id);

alter table public.returns enable row level security;

create policy "returns_select" on public.returns
  for select using (tenant_id = public.current_tenant_id());

-- İade no otomatik ata (boş bırakılırsa) — servis_no_ata()/satis_no_ata() ile aynı desen.
create or replace function public.iade_no_ata()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.return_no is null or trim(new.return_no) = '' then
    new.return_no := public.sonraki_iade_no(new.tenant_id);
  end if;
  return new;
end;
$$;

create trigger returns_no_ata
  before insert on public.returns
  for each row execute function public.iade_no_ata();

-- İçeri yazma yalnız aşağıdaki RPC'ler üzerinden olur.

create or replace function public.iade_baslat(
  p_sale_item_id uuid,
  p_miktar numeric,
  p_neden text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_kalem record;
  v_iade_edilen numeric;
  v_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_miktar is null or p_miktar <= 0 then
    raise exception 'geçersiz miktar';
  end if;

  select si.id, si.sale_id, si.item_type, si.product_id, si.quantity, si.unit_price, s.customer_id
    into v_kalem
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  where si.id = p_sale_item_id and si.tenant_id = v_tenant;

  if not found then
    raise exception 'satış kalemi bulunamadı veya erişim yok';
  end if;
  if v_kalem.item_type <> 'urun' then
    raise exception 'yalnız ürün kalemleri iade edilebilir';
  end if;

  select coalesce(sum(quantity), 0) into v_iade_edilen
  from public.returns
  where sale_item_id = p_sale_item_id and status <> 'iptal';

  if v_iade_edilen + p_miktar > v_kalem.quantity then
    raise exception 'İADE_MIKTARI_ASILDI: satılan % adetten % zaten iade edildi', v_kalem.quantity, v_iade_edilen;
  end if;

  insert into public.returns
    (tenant_id, sale_id, sale_item_id, customer_id, product_id, quantity, reason, received_by)
  values
    (v_tenant, v_kalem.sale_id, p_sale_item_id, v_kalem.customer_id, v_kalem.product_id, p_miktar,
     nullif(trim(p_neden), ''), auth.uid())
  returning id into v_id;

  perform public.audit_ekle(
    'iade_alindi', 'return', v_id::text, null,
    jsonb_build_object('sale_item_id', p_sale_item_id, 'miktar', p_miktar, 'neden', p_neden)
  );

  return v_id;
end;
$$;

create or replace function public.iade_kontrol_et(
  p_return_id uuid,
  p_sonuc text,                    -- 'satilabilir' | 'arizali' | 'hurda' | 'servise'
  p_refund_yontemi text default 'iade_yok',
  p_refund_tutar numeric default null,
  p_refund_hesap_id uuid default null,
  p_servis_beyani text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_iade record;
  v_servis_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_sonuc not in ('satilabilir', 'arizali', 'hurda', 'servise') then
    raise exception 'geçersiz kontrol sonucu';
  end if;
  if p_refund_yontemi not in ('nakit_iade', 'iade_yok') then
    raise exception 'geçersiz iade yöntemi';
  end if;
  if p_refund_yontemi = 'nakit_iade' and (p_refund_tutar is null or p_refund_tutar <= 0 or p_refund_hesap_id is null) then
    raise exception 'nakit iade için tutar ve kasa hesabı zorunlu';
  end if;

  select * into v_iade
  from public.returns
  where id = p_return_id and tenant_id = v_tenant and status = 'alindi';

  if not found then
    raise exception 'iade bulunamadı veya zaten kontrol edilmiş';
  end if;

  if p_sonuc = 'satilabilir' and v_iade.product_id is not null then
    perform public.stok_hareketi_ekle(
      v_iade.product_id, v_iade.quantity, 'return', 'return', p_return_id::text,
      'İade — satılabilir durumda stoğa geri alındı'
    );
  end if;

  if p_refund_yontemi = 'nakit_iade' then
    perform public.kasa_hareketi_ekle(
      p_refund_hesap_id, -p_refund_tutar, 'odeme', 'return', p_return_id::text,
      'Müşteri iadesi (nakit)'
    );
  end if;

  if p_sonuc = 'servise' then
    if v_iade.customer_id is null then
      raise exception 'servise yönlendirmek için satışta müşteri bilgisi olmalı';
    end if;
    insert into public.service_orders
      (tenant_id, customer_id, declared_issue, status, priority, source_service_id)
    values
      (v_tenant, v_iade.customer_id,
       coalesce(p_servis_beyani, 'İade edilen üründe arıza — servis değerlendirmesi bekleniyor'),
       'kabul_edildi', 'normal', null)
    returning id into v_servis_id;
  end if;

  update public.returns
  set status = 'kontrol_edildi', inspection_result = p_sonuc,
      refund_method = p_refund_yontemi, refund_amount = p_refund_tutar, refund_account_id = p_refund_hesap_id,
      service_order_id = v_servis_id, inspected_by = auth.uid(), inspected_at = now()
  where id = p_return_id;

  perform public.audit_ekle(
    'iade_kontrol_edildi', 'return', p_return_id::text, null,
    jsonb_build_object('sonuc', p_sonuc, 'refund_yontemi', p_refund_yontemi, 'refund_tutar', p_refund_tutar,
                        'servis_id', v_servis_id)
  );

  return v_servis_id;
end;
$$;
