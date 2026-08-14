-- =============================================================
-- ByteNova — 0014_stok_hareketleri
-- Stok hareket altyapısı + servis parça kullanımı (rezervasyon → onay)
-- =============================================================

-- ---------- STOK HAREKETLERİ ----------

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in (
    'purchase','sale','service_use','return','adjustment','count','initial'
  )),
  quantity_change numeric(12,2) not null,
  quantity_before numeric(12,2) not null,
  quantity_after numeric(12,2) not null,
  reference_type text,
  reference_id text,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_product_idx on public.stock_movements (product_id, created_at desc);
create index stock_movements_tenant_idx on public.stock_movements (tenant_id, created_at desc);

alter table public.stock_movements enable row level security;

create policy "stock_movements_select" on public.stock_movements
  for select using (tenant_id = public.current_tenant_id());

-- İçeri yazma yalnız aşağıdaki RPC fonksiyonu üzerinden olur (tutarlılık için)

-- ---------- STOK HAREKETİ UYGULAMA FONKSİYONU ----------
-- Ürün satırını kilitleyip (FOR UPDATE) miktarı günceller ve hareketi kaydeder.
-- Aynı üründe eşzamanlı iki işlemin birbirini ezmesini engeller.

create or replace function public.stok_hareketi_ekle(
  p_product_id uuid,
  p_degisim numeric,
  p_tip text,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_neden text default null
)
returns numeric
language plpgsql
as $$
declare
  v_tenant uuid;
  v_once numeric;
  v_sonra numeric;
begin
  v_tenant := public.current_tenant_id();

  select stock_quantity into v_once
  from public.products
  where id = p_product_id and tenant_id = v_tenant
  for update;

  if not found then
    raise exception 'ürün bulunamadı veya erişim yok';
  end if;

  v_sonra := v_once + p_degisim;

  update public.products
  set stock_quantity = v_sonra
  where id = p_product_id;

  insert into public.stock_movements
    (tenant_id, product_id, movement_type, quantity_change, quantity_before, quantity_after,
     reference_type, reference_id, reason, created_by)
  values
    (v_tenant, p_product_id, p_tip, p_degisim, v_once, v_sonra,
     p_referans_tip, p_referans_id, p_neden, auth.uid());

  return v_sonra;
end;
$$;

-- ---------- SERVİS PARÇALARI (rezervasyon → onay) ----------

create table public.service_parts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2),
  status text not null default 'reserved' check (status in ('reserved','consumed','cancelled')),
  removed_part_disposition text check (removed_part_disposition in ('customer','disposed','scrap_stock')),
  removed_part_note text,
  reserved_by uuid references auth.users(id) on delete set null,
  reserved_at timestamptz not null default now(),
  consumed_by uuid references auth.users(id) on delete set null,
  consumed_at timestamptz
);

create index service_parts_service_idx on public.service_parts (service_order_id, reserved_at desc);

alter table public.service_parts enable row level security;

create policy "service_parts_select" on public.service_parts
  for select using (tenant_id = public.current_tenant_id());

create policy "service_parts_insert" on public.service_parts
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager','technician')
  );

create policy "service_parts_update" on public.service_parts
  for update using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager','technician')
  );
