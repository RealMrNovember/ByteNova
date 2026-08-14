-- =============================================================
-- ByteNova — 0006_cihazlar
-- Cihaz envanteri + cihaz zaman çizelgesi
-- Kritik iş kuralı: seri numarası aynı tenant içinde çakışamaz.
-- =============================================================

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  device_type text not null default 'laptop'
    check (device_type in ('laptop','desktop','phone','tablet','console','printer','monitor','other')),
  brand text,
  model text,
  serial_no text,
  imei text,
  mac_address text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seri no tenant içinde benzersiz (boş bırakılabilir — okunamayan etiketler için)
create unique index devices_serial_unique
  on public.devices (tenant_id, serial_no)
  where serial_no is not null;

create index devices_tenant_idx on public.devices (tenant_id);
create index devices_customer_idx on public.devices (customer_id);
create index devices_imei_idx on public.devices (tenant_id, imei);

create trigger devices_updated_at
  before update on public.devices
  for each row execute function public.updated_at_guncelle();

alter table public.devices enable row level security;

create policy "devices_select" on public.devices
  for select using (tenant_id = public.current_tenant_id());

create policy "devices_insert" on public.devices
  for insert with check (tenant_id = public.current_tenant_id());

create policy "devices_update" on public.devices
  for update using (tenant_id = public.current_tenant_id());

-- ---------- CİHAZ ZAMAN ÇİZELGESİ ----------
-- Alış → Satış → Servis → Garanti olayları ilgili modüller geldikçe
-- buraya otomatik yazılacak; bugün manuel not + sistem olayları var.

create table public.device_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null default 'note'
    check (kind in ('created','ownership','service','sale','purchase','warranty','note','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index device_events_idx on public.device_events (device_id, created_at desc);

alter table public.device_events enable row level security;

create policy "device_events_select" on public.device_events
  for select using (tenant_id = public.current_tenant_id());

create policy "device_events_insert" on public.device_events
  for insert with check (tenant_id = public.current_tenant_id());
