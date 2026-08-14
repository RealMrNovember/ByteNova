-- =============================================================
-- ByteNova — 0005_musteriler
-- Müşteri kartları + iletişim geçmişi
-- =============================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  type text not null default 'individual'
    check (type in ('individual','corporate')),
  name text not null,                -- ad soyad veya firma unvanı
  phone text,
  phone2 text,
  email text,
  address text,
  tax_office text,                   -- vergi dairesi (kurumsal)
  tax_number text,                   -- VKN / TCKN (e-belge için)
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_tenant_idx on public.customers (tenant_id, is_active);
create index customers_name_idx on public.customers (tenant_id, name);
create index customers_phone_idx on public.customers (tenant_id, phone);

-- updated_at otomatik güncellensin
create or replace function public.updated_at_guncelle()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.updated_at_guncelle();

alter table public.customers enable row level security;

create policy "customers_select" on public.customers
  for select using (tenant_id = public.current_tenant_id());

create policy "customers_insert" on public.customers
  for insert with check (tenant_id = public.current_tenant_id());

create policy "customers_update" on public.customers
  for update using (tenant_id = public.current_tenant_id());

-- Hard delete yok: kayıtlar is_active=false ile pasifleştirilir (delete policy tanımlanmadı)

-- ---------- İLETİŞİM GEÇMİŞİ ----------

create table public.customer_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null default 'note'
    check (kind in ('note','call','sms','whatsapp','email','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index customer_events_idx on public.customer_events (customer_id, created_at desc);

alter table public.customer_events enable row level security;

create policy "customer_events_select" on public.customer_events
  for select using (tenant_id = public.current_tenant_id());

create policy "customer_events_insert" on public.customer_events
  for insert with check (tenant_id = public.current_tenant_id());
