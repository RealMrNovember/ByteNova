-- =============================================================
-- ByteNova — 0001_init
-- Temel: tenants, profiles, audit_logs, feature_flags + RLS
-- Uygulama: Supabase Dashboard → SQL Editor → bu dosyayı çalıştır
-- =============================================================

-- ---------- TABLOLAR ----------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'trial'
    check (status in ('trial','active','past_due','suspended','cancelled')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text,
  role text not null default 'owner'
    check (role in ('owner','manager','cashier','technician','warehouse','accounting')),
  created_at timestamptz not null default now()
);

create index profiles_tenant_idx on public.profiles (tenant_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index audit_logs_tenant_idx on public.audit_logs (tenant_id, created_at desc);

create table public.feature_flags (
  id bigint generated always as identity primary key,
  key text not null,
  status text not null default 'coming_soon'
    check (status in ('off','coming_soon','beta','on')),
  tenant_id uuid references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique nulls not distinct (key, tenant_id)
);

-- ---------- YARDIMCI FONKSİYON ----------
-- security definer: profiles üzerindeki RLS'e takılmadan tenant_id döner
-- (policy içinde recursive RLS oluşmaması için şart)

create or replace function public.current_tenant_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- ---------- RLS ----------

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;

create policy "tenant_select_own" on public.tenants
  for select using (id = public.current_tenant_id());

create policy "profiles_select_same_tenant" on public.profiles
  for select using (tenant_id = public.current_tenant_id());

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

create policy "audit_select_same_tenant" on public.audit_logs
  for select using (tenant_id = public.current_tenant_id());

create policy "audit_insert_same_tenant" on public.audit_logs
  for insert with check (tenant_id = public.current_tenant_id());

create policy "flags_select_global_or_tenant" on public.feature_flags
  for select using (tenant_id is null or tenant_id = public.current_tenant_id());

-- ---------- YENİ KAYIT TETİKLEYİCİSİ ----------
-- Kayıt olan her kullanıcı için otomatik tenant + owner profili oluşturur.
-- (Davetle mevcut tenant'a katılma akışı Gün 5'te eklenecek.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  insert into public.tenants (name)
  values (coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'İşletmem'))
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name, role)
  values (new.id, new_tenant_id, new.raw_user_meta_data->>'full_name', 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
