-- Parça uyumluluk matrisi (P1) — bkz. PROJE_DOSYASI §17 ve EKLENTI_MIMARISI (Stok Plus).
-- "Bu RAM şu anakartlarla çalışır" ilişkisini simetrik bir çift (pairwise) olarak
-- tutar; A~B eklenince B~A de doğrudur, tek satır yeterlidir (sorgular OR ile
-- her iki yönü de tarar). Basit bir CRUD tablosu — yan etkisi yok, doğrudan
-- RLS yazma politikalarıyla yönetilir (products/suppliers'la aynı desen).

create table public.product_compatibilities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  compatible_product_id uuid not null references public.products(id) on delete cascade,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint product_compatibilities_farkli_urun check (product_id <> compatible_product_id),
  unique (product_id, compatible_product_id)
);

create index product_compatibilities_reverse_idx on public.product_compatibilities (compatible_product_id);

alter table public.product_compatibilities enable row level security;

create policy product_compatibilities_select on public.product_compatibilities for select
  using (tenant_id = public.current_tenant_id());
create policy product_compatibilities_insert on public.product_compatibilities for insert
  with check (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager', 'warehouse'));
create policy product_compatibilities_delete on public.product_compatibilities for delete
  using (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager', 'warehouse'));
