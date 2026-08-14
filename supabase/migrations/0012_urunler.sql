-- =============================================================
-- ByteNova — 0012_urunler
-- Ürün kartı + kategori yönetimi (Sprint 3, Gün 11)
-- Fiyat alanları bugün TL bazlı; Gün 12'de döviz desteğiyle genişletilecek.
-- Stok miktarı bugün basit bir sayaç; Gün 13'te stok hareketleri bu alanı besleyecek.
-- =============================================================

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

alter table public.product_categories enable row level security;

create policy "product_categories_select" on public.product_categories
  for select using (tenant_id = public.current_tenant_id());

create policy "product_categories_insert" on public.product_categories
  for insert with check (tenant_id = public.current_tenant_id());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  sku text,
  barcode text,
  name text not null,
  brand text,
  unit text not null default 'adet',
  purchase_price numeric(12,2),
  sale_price numeric(12,2),
  vat_rate numeric(5,2) not null default 20,
  min_stock numeric(12,2) not null default 0,
  critical_stock numeric(12,2) not null default 0,
  stock_quantity numeric(12,2) not null default 0,
  requires_serial boolean not null default false,
  warranty_months int,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Barkod tenant içinde benzersiz (boş bırakılabilir)
create unique index products_barcode_unique
  on public.products (tenant_id, barcode)
  where barcode is not null;

create index products_tenant_idx on public.products (tenant_id, is_active);
create index products_name_idx on public.products (tenant_id, name);
create index products_category_idx on public.products (category_id);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.updated_at_guncelle();

alter table public.products enable row level security;

create policy "products_select" on public.products
  for select using (tenant_id = public.current_tenant_id());

create policy "products_insert" on public.products
  for insert with check (tenant_id = public.current_tenant_id());

create policy "products_update" on public.products
  for update using (tenant_id = public.current_tenant_id());

-- Hard delete yok: kayıtlar is_active=false ile pasifleştirilir
