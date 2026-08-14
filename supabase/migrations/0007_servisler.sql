-- =============================================================
-- ByteNova — 0007_servisler
-- Servis kabul, durum makinesi, servis numarası üretimi
-- =============================================================

-- ---------- SERVİS NUMARASI SAYAÇLARI ----------
-- Format: BN-YYYY-NNNNNN (tenant + yıl bazlı, tenant içinde benzersiz)

create table public.service_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_servis_no(p_tenant_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  yil int := extract(year from now());
  sira int;
begin
  insert into public.service_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, yil, 1)
  on conflict (tenant_id, year)
  do update set last_no = service_no_counters.last_no + 1
  returning last_no into sira;

  return 'BN-' || yil || '-' || lpad(sira::text, 6, '0');
end;
$$;

-- ---------- SERVİS KAYITLARI ----------

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  service_no text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  device_id uuid references public.devices(id) on delete set null,
  status text not null default 'kabul_edildi' check (status in (
    'kabul_edildi','incelemede','fiyatlandirma_bekliyor','onay_bekliyor',
    'onaylandi','onariliyor','test_ediliyor','hazir','teslim_edildi',
    'parca_bekleniyor','dis_serviste','kargoda','garanti_kapsaminda',
    'teslim_alinmadi','iptal','onarilamadi','musteri_vazgecti','hurda'
  )),
  priority text not null default 'normal' check (priority in ('dusuk','normal','yuksek','acil')),
  declared_issue text not null,
  physical_condition jsonb not null default '{}'::jsonb,
  accessories jsonb not null default '[]'::jsonb,
  consent_accepted boolean not null default false,
  consent_accepted_at timestamptz,
  technician_id uuid references auth.users(id) on delete set null,
  estimated_cost numeric(12,2),
  final_cost numeric(12,2),
  advance_paid numeric(12,2) not null default 0,
  source_service_id uuid references public.service_orders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create unique index service_orders_no_unique on public.service_orders (tenant_id, service_no);
create index service_orders_tenant_idx on public.service_orders (tenant_id, status);
create index service_orders_customer_idx on public.service_orders (customer_id);
create index service_orders_device_idx on public.service_orders (device_id);
create index service_orders_technician_idx on public.service_orders (technician_id);

create trigger service_orders_updated_at
  before update on public.service_orders
  for each row execute function public.updated_at_guncelle();

-- Servis no otomatik ata (boş bırakılırsa)
create or replace function public.servis_no_ata()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.service_no is null or trim(new.service_no) = '' then
    new.service_no := public.sonraki_servis_no(new.tenant_id);
  end if;
  return new;
end;
$$;

create trigger service_orders_no_ata
  before insert on public.service_orders
  for each row execute function public.servis_no_ata();

alter table public.service_orders enable row level security;

create policy "service_orders_select" on public.service_orders
  for select using (tenant_id = public.current_tenant_id());

create policy "service_orders_insert" on public.service_orders
  for insert with check (tenant_id = public.current_tenant_id());

create policy "service_orders_update" on public.service_orders
  for update using (tenant_id = public.current_tenant_id());

-- ---------- DURUM GEÇMİŞİ ----------

create table public.service_status_history (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  user_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index service_status_history_idx on public.service_status_history (service_order_id, created_at);

alter table public.service_status_history enable row level security;

create policy "service_status_history_select" on public.service_status_history
  for select using (tenant_id = public.current_tenant_id());

create policy "service_status_history_insert" on public.service_status_history
  for insert with check (tenant_id = public.current_tenant_id());

-- Durum her değiştiğinde (ve ilk oluşturmada) otomatik geçmiş kaydı
create or replace function public.servis_durum_logla()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.service_status_history (tenant_id, service_order_id, from_status, to_status, user_id)
    values (new.tenant_id, new.id, null, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.service_status_history (tenant_id, service_order_id, from_status, to_status, user_id)
    values (new.tenant_id, new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger service_orders_durum_log_insert
  after insert on public.service_orders
  for each row execute function public.servis_durum_logla();

create trigger service_orders_durum_log_update
  after update on public.service_orders
  for each row execute function public.servis_durum_logla();
