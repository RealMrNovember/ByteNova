-- =============================================================
-- ByteNova — 0027_tedarikci_alis
-- Sprint 5, Gün 21: Tedarikçi kartı + dövizli alış faturası girişi.
-- Alış → stok girişi → maliyet güncelleme → fiyat kuralı tetikleme
-- tek atomik RPC'de (alis_olustur) yapılır — Gün 16'daki satis_olustur
-- ile aynı desen (stok_hareketi_ekle() üzerinden, negatif stok politikası
-- otomatik geçerli — ki alışta stok her zaman artacağından bu pratikte
-- hiç tetiklenmez).
--
-- Bilinçli kapsam dışı (Gün 22'ye bırakıldı, Gün 20'deki "açık hesap
-- mahsup" kararıyla aynı gerekçe): tedarikçi cari/borç takibi henüz yok.
-- `payment_status` yalnız bilgi amaçlı bir alan — kasa/cari'ye henüz
-- bağlı değil, Gün 22'de üzerine inşa edilecek.
-- =============================================================

-- ---------- TEDARİKÇİLER ----------

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  currency text not null default 'TRY' references public.currencies(code),
  iban text,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index suppliers_tenant_idx on public.suppliers (tenant_id, name);

alter table public.suppliers enable row level security;

create policy "suppliers_select" on public.suppliers
  for select using (tenant_id = public.current_tenant_id());

create policy "suppliers_insert" on public.suppliers
  for insert with check (tenant_id = public.current_tenant_id());

create policy "suppliers_update" on public.suppliers
  for update using (tenant_id = public.current_tenant_id());

-- Hard delete yok: müşteri deseniyle aynı — pasifleştirme (is_active=false)

-- ---------- ALIŞ NUMARASI SAYAÇLARI ----------
-- Format: AL-YYYY-NNNNNN (sale_no / service_no ile aynı desen)

create table public.purchase_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_alis_no(p_tenant_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  yil int := extract(year from now());
  sira int;
begin
  insert into public.purchase_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, yil, 1)
  on conflict (tenant_id, year)
  do update set last_no = purchase_no_counters.last_no + 1
  returning last_no into sira;

  return 'AL-' || yil || '-' || lpad(sira::text, 6, '0');
end;
$$;

-- ---------- ALIŞLAR ----------

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_no text not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  supplier_invoice_no text,
  invoice_date date not null,
  currency text not null default 'TRY' references public.currencies(code),
  exchange_rate numeric(12,4) not null default 1,
  total_amount numeric(12,2) not null,
  payment_status text not null default 'odenmedi'
    check (payment_status in ('odenmedi', 'kismi', 'odendi')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index purchases_no_unique on public.purchases (tenant_id, purchase_no);
create index purchases_tenant_idx on public.purchases (tenant_id, invoice_date desc);
create index purchases_supplier_idx on public.purchases (supplier_id);

alter table public.purchases enable row level security;

create policy "purchases_select" on public.purchases
  for select using (tenant_id = public.current_tenant_id());

-- ---------- ALIŞ KALEMLERİ ----------

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create index purchase_items_purchase_idx on public.purchase_items (purchase_id);

alter table public.purchase_items enable row level security;

create policy "purchase_items_select" on public.purchase_items
  for select using (tenant_id = public.current_tenant_id());

-- Her iki tabloya da yazma yalnız alis_olustur() üzerinden — alış +
-- kalemler + stok girişi + maliyet/fiyat güncellemesi tek atomik işlem.

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

    -- Stok girişi (negatif stok politikası bu yönde hiç tetiklenmez —
    -- alış her zaman stoğu artırır).
    perform public.stok_hareketi_ekle(
      v_kalem.product_id, v_kalem.quantity, 'purchase', 'purchase', v_purchase_id::text,
      'Alış: ' || v_purchase_no
    );

    -- Maliyet güncelleme + fiyat kuralı tetikleme: ürünün alış fiyatı bu
    -- alışın birim fiyatına güncellenir (tek-değerli maliyet modeli —
    -- ağırlıklı ortalama/FIFO Gün 27'de "maliyet yöntemi" ile gelecek).
    -- auto_price açıksa satış fiyatı da aynı formülle (fiyatHesapla ile
    -- birebir) anında yeniden hesaplanır.
    update public.products
    set purchase_price = v_kalem.unit_price,
        purchase_currency = p_currency,
        sale_price = case
          when auto_price then ceil(v_kalem.unit_price * p_exchange_rate * (1 + coalesce(price_margin, 0) / 100.0))
          else sale_price
        end
    where id = v_kalem.product_id and tenant_id = v_tenant;
  end loop;

  perform public.audit_ekle(
    'alis_olusturuldu', 'purchase', v_purchase_id::text, null,
    jsonb_build_object('purchase_no', v_purchase_no, 'toplam', v_toplam, 'para_birimi', p_currency)
  );

  return v_purchase_id;
end;
$$;
