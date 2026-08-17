-- =============================================================
-- ByteNova — 0029_satin_alma_talepleri
-- Sprint 5, Gün 23: Satın alma talepleri.
--   1) Servisten "parça bekleniyor" — teknisyen ihtiyaç duyduğu parçayı
--      talep eder (S3 senaryosu).
--   2) Kritik stoktan otomatik — bir ürün kritik seviyenin altına
--      düştüğü ANDA (trigger), zaten açık bir talebi yoksa otomatik
--      talep oluşturulur.
--   3) Parça geldi → alış → stok → servise otomatik bağlanma —
--      alis_olustur() her kalem için o ürüne ait en eski açık talebi
--      otomatik "karşılandı" işaretler; talep bir servise bağlıysa
--      o servise "parça geldi" sistem notu düşer.
-- =============================================================

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(12,2) not null check (quantity > 0),
  source text not null check (source in ('servis', 'kritik_stok', 'manuel')),
  service_order_id uuid references public.service_orders(id) on delete set null,
  status text not null default 'bekliyor'
    check (status in ('bekliyor', 'siparis_edildi', 'karsilandi', 'iptal')),
  note text,
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  fulfilled_purchase_id uuid references public.purchases(id) on delete set null,
  fulfilled_at timestamptz
);

create index purchase_requests_tenant_idx on public.purchase_requests (tenant_id, status, requested_at desc);
create index purchase_requests_product_idx on public.purchase_requests (product_id, status);
create index purchase_requests_service_idx on public.purchase_requests (service_order_id);

alter table public.purchase_requests enable row level security;

create policy "purchase_requests_select" on public.purchase_requests
  for select using (tenant_id = public.current_tenant_id());

-- Yazma yalnız aşağıdaki RPC'ler ve kritik stok tetikleyicisi üzerinden.

create or replace function public.satin_alma_talebi_olustur(
  p_product_id uuid,
  p_miktar numeric,
  p_kaynak text default 'manuel',
  p_servis_id uuid default null,
  p_not text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_kaynak not in ('servis', 'kritik_stok', 'manuel') then
    raise exception 'geçersiz kaynak';
  end if;
  if p_miktar is null or p_miktar <= 0 then
    raise exception 'geçersiz miktar';
  end if;
  if p_kaynak = 'servis' and p_servis_id is null then
    raise exception 'servis kaynaklı talep için servis seçilmeli';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and tenant_id = v_tenant) then
    raise exception 'ürün bulunamadı veya erişim yok';
  end if;

  insert into public.purchase_requests
    (tenant_id, product_id, quantity, source, service_order_id, note, requested_by)
  values
    (v_tenant, p_product_id, p_miktar, p_kaynak, p_servis_id, nullif(trim(p_not), ''), auth.uid())
  returning id into v_id;

  perform public.audit_ekle(
    'satin_alma_talebi_olusturuldu', 'purchase_request', v_id::text, null,
    jsonb_build_object('product_id', p_product_id, 'miktar', p_miktar, 'kaynak', p_kaynak)
  );

  return v_id;
end;
$$;

create or replace function public.satin_alma_talebi_iptal(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.purchase_requests
  set status = 'iptal'
  where id = p_id and tenant_id = v_tenant and status in ('bekliyor', 'siparis_edildi');

  if not found then
    raise exception 'talep bulunamadı veya zaten kapatılmış';
  end if;

  perform public.audit_ekle('satin_alma_talebi_iptal_edildi', 'purchase_request', p_id::text);
end;
$$;

-- ---------- KRİTİK STOKTAN OTOMATİK TALEP ----------
-- Bir ürün kritik seviyeye YENİ düşüyorsa (önceki durumda kritik
-- değildi) ve zaten açık bir talebi yoksa otomatik talep oluşturur.
-- Yalnız stock_quantity değiştiğinde tetiklenir — alakasız ürün
-- düzenlemelerinde (ad, fiyat vb.) çalışmaz.

create or replace function public.kritik_stok_talebi_olustur()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.stock_quantity <= new.critical_stock
     and old.stock_quantity > old.critical_stock
     and not exists (
       select 1 from public.purchase_requests
       where product_id = new.id and status in ('bekliyor', 'siparis_edildi')
     )
  then
    insert into public.purchase_requests
      (tenant_id, product_id, quantity, source, note)
    values
      (new.tenant_id, new.id, greatest(new.min_stock - new.stock_quantity, 1), 'kritik_stok',
       'Stok kritik seviyenin altına düştü (mevcut: ' || new.stock_quantity || ', kritik: ' || new.critical_stock || ')');
  end if;
  return new;
end;
$$;

create trigger products_kritik_stok_talebi
  after update of stock_quantity on public.products
  for each row execute function public.kritik_stok_talebi_olustur();

-- ---------- alis_olustur(): parça geldi → talebi karşıla → servise bağlan ----------
-- İmza değişmiyor — düz create-or-replace güvenli.

create or replace function public.alis_olustur(
  p_supplier_id uuid,
  p_supplier_invoice_no text,
  p_invoice_date date,
  p_currency text,
  p_exchange_rate numeric,
  p_kalemler jsonb,
  p_payment_status text default 'odenmedi',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_purchase_id uuid;
  v_purchase_no text;
  v_toplam numeric := 0;
  v_kalem record;
  v_talep_id uuid;
  v_talep_servis_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if not exists (
    select 1 from public.suppliers where id = p_supplier_id and tenant_id = v_tenant
  ) then
    raise exception 'tedarikçi bulunamadı veya erişim yok';
  end if;

  if p_payment_status not in ('odenmedi', 'kismi', 'odendi') then
    raise exception 'geçersiz ödeme durumu';
  end if;

  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'geçersiz kur';
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_toplam
  from jsonb_to_recordset(p_kalemler)
    as x(product_id uuid, quantity numeric, unit_price numeric);

  if v_toplam <= 0 then
    raise exception 'alışta en az bir geçerli kalem olmalı';
  end if;

  v_purchase_no := public.sonraki_alis_no(v_tenant);

  insert into public.purchases
    (tenant_id, purchase_no, supplier_id, supplier_invoice_no, invoice_date,
     currency, exchange_rate, total_amount, payment_status, notes, created_by)
  values
    (v_tenant, v_purchase_no, p_supplier_id, nullif(trim(p_supplier_invoice_no), ''), p_invoice_date,
     p_currency, p_exchange_rate, v_toplam, p_payment_status, nullif(trim(p_notes), ''), auth.uid())
  returning id into v_purchase_id;

  for v_kalem in
    select * from jsonb_to_recordset(p_kalemler)
      as x(product_id uuid, quantity numeric, unit_price numeric)
  loop
    if v_kalem.product_id is null then
      raise exception 'her kalem bir ürüne bağlı olmalı';
    end if;
    if v_kalem.quantity is null or v_kalem.quantity <= 0 then
      raise exception 'geçersiz miktar';
    end if;
    if v_kalem.unit_price is null or v_kalem.unit_price < 0 then
      raise exception 'geçersiz birim fiyat';
    end if;

    insert into public.purchase_items
      (tenant_id, purchase_id, product_id, quantity, unit_price, line_total)
    values
      (v_tenant, v_purchase_id, v_kalem.product_id, v_kalem.quantity, v_kalem.unit_price,
       v_kalem.quantity * v_kalem.unit_price);

    perform public.stok_hareketi_ekle(
      v_kalem.product_id, v_kalem.quantity, 'purchase', 'purchase', v_purchase_id::text,
      'Alış: ' || v_purchase_no
    );

    update public.products
    set purchase_price = v_kalem.unit_price,
        purchase_currency = p_currency,
        sale_price = case
          when auto_price then ceil(v_kalem.unit_price * p_exchange_rate * (1 + coalesce(price_margin, 0) / 100.0))
          else sale_price
        end
    where id = v_kalem.product_id and tenant_id = v_tenant;

    -- Bu ürüne ait en eski açık satın alma talebini otomatik karşıla.
    select id, service_order_id into v_talep_id, v_talep_servis_id
    from public.purchase_requests
    where product_id = v_kalem.product_id and tenant_id = v_tenant
      and status in ('bekliyor', 'siparis_edildi')
    order by requested_at
    limit 1;

    if v_talep_id is not null then
      update public.purchase_requests
      set status = 'karsilandi', fulfilled_purchase_id = v_purchase_id, fulfilled_at = now()
      where id = v_talep_id;

      if v_talep_servis_id is not null then
        insert into public.service_notes (tenant_id, service_order_id, user_id, content)
        values (
          v_tenant, v_talep_servis_id, auth.uid(),
          '📦 Talep edilen parça geldi: ' || v_kalem.quantity || ' adet (Alış ' || v_purchase_no || ')'
        );
      end if;

      v_talep_id := null;
      v_talep_servis_id := null;
    end if;
  end loop;

  perform public.tedarikci_borc_ekle(
    p_supplier_id, v_toplam, p_exchange_rate, 'purchase', v_purchase_id::text,
    'Alış: ' || v_purchase_no
  );

  perform public.audit_ekle(
    'alis_olusturuldu', 'purchase', v_purchase_id::text, null,
    jsonb_build_object('purchase_no', v_purchase_no, 'toplam', v_toplam, 'para_birimi', p_currency)
  );

  return v_purchase_id;
end;
$$;
