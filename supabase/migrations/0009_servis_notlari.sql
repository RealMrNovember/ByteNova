-- =============================================================
-- ByteNova — 0009_servis_notlari
-- Teknisyen teknik notları (müşteri beyanından ayrı, ekip-içi)
-- =============================================================

create table public.service_notes (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index service_notes_idx on public.service_notes (service_order_id, created_at desc);

alter table public.service_notes enable row level security;

create policy "service_notes_select" on public.service_notes
  for select using (tenant_id = public.current_tenant_id());

create policy "service_notes_insert" on public.service_notes
  for insert with check (tenant_id = public.current_tenant_id());
