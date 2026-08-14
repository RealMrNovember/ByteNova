-- =============================================================
-- ByteNova — 0003_feature_notify
-- "Hazır olunca haber ver" kayıtları
-- (feature_flags tablosu 0001'de kuruldu; bu tablo talep ölçümü içindir)
-- =============================================================

create table public.feature_notify_requests (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  created_at timestamptz not null default now(),
  unique (feature_key, user_id)
);

create index feature_notify_key_idx on public.feature_notify_requests (feature_key);

alter table public.feature_notify_requests enable row level security;

create policy "notify_insert_own" on public.feature_notify_requests
  for insert to authenticated
  with check (user_id = auth.uid() and tenant_id = public.current_tenant_id());

create policy "notify_select_own" on public.feature_notify_requests
  for select using (user_id = auth.uid());

create policy "notify_delete_own" on public.feature_notify_requests
  for delete using (user_id = auth.uid());
