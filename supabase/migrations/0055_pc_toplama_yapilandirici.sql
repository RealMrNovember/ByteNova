-- PC Toplama'nın profesyonel yapılandırıcı deneyimi: kategori bazlı gezinme için
-- ürünlere sabit bir bileşen tipi etiketi eklenir; stok gerektirmeyen "Genel/Plan"
-- modu için ayrı, hafif bir plan şeması kurulur (assembly_plans/assembly_plan_items) —
-- gerçek stok hareketi doğurmaz, yalnızca müşteriye sunulacak bir fiyat/plan taslağıdır.
-- Bir plan gerçek bir toplama emrine dönüştürülmek istendiğinde her kalemin gerçek bir
-- stok kartıyla (product_id) eşleştirilmesi kullanıcıdan istenir — sahte/var olmayan bir
-- üründen stok düşürülemez.

alter table public.products
  add column component_type text
  check (component_type in ('islemci', 'anakart', 'ram', 'depolama', 'ekran_karti', 'guc_kaynagi', 'kasa', 'sogutucu', 'diger'));

create index products_component_type_idx on public.products (tenant_id, component_type) where component_type is not null;

create table public.assembly_plan_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_plan_no(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yil int := extract(year from now());
  sira int;
begin
  insert into public.assembly_plan_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, yil, 1)
  on conflict (tenant_id, year)
  do update set last_no = assembly_plan_no_counters.last_no + 1
  returning last_no into sira;

  return 'PLN-' || yil || '-' || lpad(sira::text, 6, '0');
end;
$$;

create table public.assembly_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_no text not null,
  customer_id uuid references public.customers(id),
  name text not null,
  labor_cost numeric(12, 2) not null default 0,
  status text not null default 'taslak' check (status in ('taslak', 'donusturuldu', 'iptal')),
  converted_order_id uuid references public.assembly_orders(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, plan_no)
);

create table public.assembly_plan_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.assembly_plans(id) on delete cascade,
  component_type text not null check (component_type in ('islemci', 'anakart', 'ram', 'depolama', 'ekran_karti', 'guc_kaynagi', 'kasa', 'sogutucu', 'diger')),
  name text not null,
  brand text,
  estimated_price numeric(12, 2) not null default 0,
  quantity numeric not null default 1 check (quantity > 0),
  matched_product_id uuid references public.products(id),
  sort_order int not null default 0
);

alter table public.assembly_plans enable row level security;
alter table public.assembly_plan_items enable row level security;

create policy assembly_plans_select on public.assembly_plans for select
  using (tenant_id = public.current_tenant_id());
create policy assembly_plan_items_select on public.assembly_plan_items for select
  using (tenant_id = public.current_tenant_id());

-- Yazmalar RPC üzerinden: plan no üretimi + kalem senkronu tek bir tutarlı işlemde
-- yapılmalı (PC Toplama'nın checklist hatasından çıkarılan dersin burada da uygulanması).

create or replace function public.pc_plani_olustur(p_musteri_id uuid, p_ad text, p_iscilik numeric, p_kalemler jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_plan_id uuid;
  v_no text;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  v_no := public.sonraki_plan_no(v_tenant);

  insert into public.assembly_plans (tenant_id, plan_no, customer_id, name, labor_cost, created_by)
  values (v_tenant, v_no, p_musteri_id, p_ad, coalesce(p_iscilik, 0), auth.uid())
  returning id into v_plan_id;

  insert into public.assembly_plan_items
    (tenant_id, plan_id, component_type, name, brand, estimated_price, quantity, sort_order)
  select v_tenant, v_plan_id, k.component_type, k.name, k.brand, k.estimated_price, k.quantity, k.sort_order
  from jsonb_to_recordset(p_kalemler) as k(
    component_type text, name text, brand text, estimated_price numeric, quantity numeric, sort_order int
  );

  perform public.audit_ekle('pc_plani_olusturuldu', 'assembly_plan', v_plan_id::text, null,
    jsonb_build_object('no', v_no, 'ad', p_ad));

  return v_plan_id;
end;
$$;

create or replace function public.pc_plani_kalem_esle(p_plan_item_id uuid, p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.assembly_plan_items set matched_product_id = p_product_id
  where id = p_plan_item_id and tenant_id = v_tenant;
  if not found then
    raise exception 'plan kalemi bulunamadı';
  end if;
end;
$$;

create or replace function public.pc_plani_toplama_emrine_donustur(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_plan record;
  v_order_id uuid;
  v_no text;
  v_eslesmeyen int;
  v_kalem record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select * into v_plan from public.assembly_plans where id = p_plan_id and tenant_id = v_tenant;
  if not found then
    raise exception 'plan bulunamadı';
  end if;
  if v_plan.status <> 'taslak' then
    raise exception 'bu plan zaten dönüştürülmüş veya iptal edilmiş';
  end if;

  select count(*) into v_eslesmeyen from public.assembly_plan_items
  where plan_id = p_plan_id and matched_product_id is null;
  if v_eslesmeyen > 0 then
    raise exception 'ESLESMEYEN_KALEM: % kalem henüz bir stok kartıyla eşleştirilmedi', v_eslesmeyen;
  end if;

  v_no := public.sonraki_toplama_no(v_tenant);

  insert into public.assembly_orders (tenant_id, order_no, customer_id, labor_cost, status, created_by)
  values (v_tenant, v_no, v_plan.customer_id, v_plan.labor_cost, 'taslak', auth.uid())
  returning id into v_order_id;

  for v_kalem in select * from public.assembly_plan_items where plan_id = p_plan_id
  loop
    insert into public.assembly_order_items (tenant_id, assembly_order_id, product_id, product_name, quantity, unit_cost_try)
    select v_tenant, v_order_id, v_kalem.matched_product_id, p.name, v_kalem.quantity, p.purchase_price
    from public.products p where p.id = v_kalem.matched_product_id;
  end loop;

  update public.assembly_orders set
    parts_cost = (select coalesce(sum(quantity * unit_cost_try), 0) from public.assembly_order_items where assembly_order_id = v_order_id)
  where id = v_order_id;

  update public.assembly_plans set status = 'donusturuldu', converted_order_id = v_order_id where id = p_plan_id;

  perform public.audit_ekle('pc_plani_donusturuldu', 'assembly_plan', p_plan_id::text, null,
    jsonb_build_object('toplama_emri_id', v_order_id, 'order_no', v_no));

  return v_order_id;
end;
$$;
