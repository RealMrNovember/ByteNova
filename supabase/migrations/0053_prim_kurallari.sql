-- Personel ve Prim (P1) — bkz. PROJE_DOSYASI §29.
-- Prim burada bir MUHASEBE KAYDI değil, dönem sonu bir RAPORdur: kural tenant
-- tarafından tanımlanır (satış primi ciro/kâr bazlı oran; teknisyen primi
-- sabit tutar/servis veya işçilik cirosu bazlı oran), tutar Raporlar >
-- Personel/Prim sekmesinde seçilen dönem için CANLI hesaplanır — ayrı bir
-- prim hareketi tablosu/ledger'ı yoktur (bordroya veri sağlar, bordro tutmaz).

create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('satis', 'servis')),
  basis text not null,
  rate_percent numeric(5, 2),
  fixed_amount numeric(12, 2),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (tenant_id, role),
  constraint commission_rules_basis_check check (
    (role = 'satis' and basis in ('ciro', 'karlilik'))
    or (role = 'servis' and basis in ('servis_adedi', 'iscilik_cirosu'))
  )
);

alter table public.commission_rules enable row level security;

create policy commission_rules_select on public.commission_rules for select
  using (tenant_id = public.current_tenant_id());
create policy commission_rules_insert on public.commission_rules for insert
  with check (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager'));
create policy commission_rules_update on public.commission_rules for update
  using (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager'));
create policy commission_rules_delete on public.commission_rules for delete
  using (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager'));
