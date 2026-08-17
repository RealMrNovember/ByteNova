-- =============================================================
-- ByteNova — 0043_dijital_urun_lisans
-- Sprint 7-8: Dijital ürün (lisans key) — Bölüm: "Stok adedi yerine key
-- havuzu; satışta key rezerve edilir, belgeye/e-postaya yazılır, kullanılan
-- key müşteriye bağlanır" (docs/ByteNova_PROJE_DOSYASI_v2.md).
-- =============================================================

alter table public.products add column is_digital boolean not null default false;

comment on column public.products.is_digital is
  'true ise bu ürünün "stoğu" product_license_keys havuzudur — stock_quantity kullanılmaz.';

-- ---------- LİSANS ANAHTARI HAVUZU ----------

create table public.product_license_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  key_value text not null,
  status text not null default 'musait' check (status in ('musait', 'satildi', 'iptal')),
  sale_id uuid references public.sales(id) on delete set null,
  sale_item_id uuid references public.sale_items(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, product_id, key_value)
);

create index product_license_keys_urun_idx
  on public.product_license_keys (tenant_id, product_id, status);

alter table public.product_license_keys enable row level security;

create policy product_license_keys_select on public.product_license_keys
  for select using (tenant_id = public.current_tenant_id());

create policy product_license_keys_insert on public.product_license_keys
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner', 'manager', 'warehouse')
  );

create policy product_license_keys_update on public.product_license_keys
  for update using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner', 'manager', 'warehouse')
  );

-- Satış kaleminde bir dijital ürüne atanan anahtarlar — belge/e-posta/satış
-- detayında ayrıca product_license_keys'e join gerekmeden gösterilebilsin.
alter table public.sale_items add column assigned_license_keys text[];

-- ---------- TOPLU ANAHTAR EKLEME ----------

create or replace function public.lisans_anahtari_toplu_ekle(
  p_product_id uuid,
  p_anahtarlar text[]
)
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_eklenen int := 0;
  v_anahtar text;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if not exists (
    select 1 from public.products
    where id = p_product_id and tenant_id = v_tenant and is_digital = true
  ) then
    raise exception 'ürün bulunamadı veya dijital ürün değil';
  end if;

  foreach v_anahtar in array p_anahtarlar
  loop
    v_anahtar := trim(v_anahtar);
    if v_anahtar = '' then
      continue;
    end if;
    insert into public.product_license_keys (tenant_id, product_id, key_value, created_by)
    values (v_tenant, p_product_id, v_anahtar, auth.uid())
    on conflict (tenant_id, product_id, key_value) do nothing;
    if found then
      v_eklenen := v_eklenen + 1;
    end if;
  end loop;

  perform public.audit_ekle(
    'lisans_anahtari_eklendi', 'product', p_product_id::text, null,
    jsonb_build_object('eklenen_sayisi', v_eklenen)
  );

  return v_eklenen;
end;
$$;

-- ---------- ANAHTAR İPTALİ (yalnız "müsait" durumundaki hatalı girişler) ----------

create or replace function public.lisans_anahtari_iptal(p_key_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_urun_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.product_license_keys
  set status = 'iptal'
  where id = p_key_id and tenant_id = v_tenant and status = 'musait'
  returning product_id into v_urun_id;

  if not found then
    raise exception 'anahtar bulunamadı veya zaten satılmış/iptal edilmiş';
  end if;

  perform public.audit_ekle('lisans_anahtari_iptal_edildi', 'product', v_urun_id::text, null, null);
end;
$$;

-- ---------- satis_olustur(): dijital ürünlerde stok yerine anahtar rezervasyonu ----------
-- İmza değişmiyor. Fiziksel ürünlerde davranış birebir aynı (stok hareketi).
-- Dijital üründe: stok hareketi YERİNE miktar kadar "musait" anahtar
-- FOR UPDATE SKIP LOCKED ile kilitlenip "satildi"ya çevrilir, satış kalemine
-- assigned_license_keys olarak yazılır. Yetersiz anahtar varsa işlem geri
-- alınır (aynı STOK_YETERSIZ ailesinde okunabilir bir hata mesajıyla).

create or replace function public.satis_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,
  p_odemeler jsonb,
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
  v_urun record;
  v_kur numeric;
  v_birim_maliyet_tl numeric;
  v_sale_item_id uuid;
  v_anahtar_idler uuid[];
  v_atanan_anahtarlar text[];
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

    v_urun := null;
    v_birim_maliyet_tl := null;
    if v_kalem.item_type = 'urun' and v_kalem.product_id is not null then
      select purchase_price, purchase_currency, is_digital into v_urun
      from public.products where id = v_kalem.product_id and tenant_id = v_tenant;

      if v_urun.purchase_price is not null then
        if v_urun.purchase_currency = 'TRY' then
          v_birim_maliyet_tl := v_urun.purchase_price;
        else
          select rate_to_try into v_kur
          from public.exchange_rates
          where currency_code = v_urun.purchase_currency and tenant_id = v_tenant;
          if v_kur is null then
            select rate_to_try into v_kur
            from public.exchange_rates
            where currency_code = v_urun.purchase_currency and tenant_id is null;
          end if;
          if v_kur is not null then
            v_birim_maliyet_tl := v_urun.purchase_price * v_kur;
          end if;
        end if;
      end if;
    end if;

    insert into public.sale_items
      (tenant_id, sale_id, item_type, product_id, name, quantity, unit_price, discount_amount, line_total, unit_cost)
    values
      (v_tenant, v_sale_id, v_kalem.item_type, v_kalem.product_id, v_kalem.name,
       v_kalem.quantity, v_kalem.unit_price, coalesce(v_kalem.discount_amount, 0),
       v_kalem.quantity * v_kalem.unit_price - coalesce(v_kalem.discount_amount, 0),
       v_birim_maliyet_tl)
    returning id into v_sale_item_id;

    if v_kalem.item_type = 'urun' and v_kalem.product_id is not null and coalesce(v_urun.is_digital, false) then
      if v_kalem.quantity <> floor(v_kalem.quantity) then
        raise exception 'dijital ürünlerde miktar tam sayı olmalı: %', v_kalem.name;
      end if;

      select array_agg(id), array_agg(key_value) into v_anahtar_idler, v_atanan_anahtarlar
      from (
        select id, key_value from public.product_license_keys
        where product_id = v_kalem.product_id and tenant_id = v_tenant and status = 'musait'
        order by created_at
        limit v_kalem.quantity
        for update skip locked
      ) as secilenler;

      if v_anahtar_idler is null or array_length(v_anahtar_idler, 1) < v_kalem.quantity then
        raise exception 'LISANS_ANAHTARI_YETERSIZ: % için yeterli müsait lisans anahtarı yok (% adet gerekli)', v_kalem.name, v_kalem.quantity;
      end if;

      update public.product_license_keys
      set status = 'satildi', sale_id = v_sale_id, sale_item_id = v_sale_item_id,
          customer_id = p_musteri_id, used_at = now()
      where id = any(v_anahtar_idler);

      update public.sale_items
      set assigned_license_keys = v_atanan_anahtarlar
      where id = v_sale_item_id;
    elsif v_kalem.item_type = 'urun' and v_kalem.product_id is not null then
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

    if v_odeme.method = 'acik_hesap' then
      perform public.musteri_borc_ekle(
        p_musteri_id, v_odeme.amount, 'acik_hesap_satis', 'sale', v_sale_id::text,
        'Açık hesap satış: ' || (select sale_no from public.sales where id = v_sale_id)
      );
    else
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
