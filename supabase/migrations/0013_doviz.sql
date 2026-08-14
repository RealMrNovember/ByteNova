-- =============================================================
-- ByteNova — 0013_doviz
-- Çoklu döviz desteği: TRY sabit taban, USD/EUR/GBP (ve genişletilebilir)
-- TCMB günlük kur + tenant bazlı manuel "dükkân kuru" override
-- =============================================================

create table public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  sort_order int not null default 0
);

alter table public.currencies enable row level security;

create policy "currencies_select" on public.currencies
  for select to authenticated using (true);

insert into public.currencies (code, name, symbol, sort_order) values
  ('TRY', 'Türk Lirası', '₺', 0),
  ('USD', 'Amerikan Doları', '$', 1),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'İngiliz Sterlini', '£', 3)
on conflict (code) do nothing;

-- ---------- KURLAR ----------
-- tenant_id null = global TCMB kuru (herkese açık, günlük cron günceller)
-- tenant_id dolu = o tenant'ın manuel "dükkân kuru" override'ı (öncelikli)

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null references public.currencies(code),
  tenant_id uuid references public.tenants(id) on delete cascade,
  rate_to_try numeric(12,4) not null check (rate_to_try > 0),
  source text not null default 'tcmb' check (source in ('tcmb','manual')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique (currency_code, tenant_id)
);

create index exchange_rates_global_idx on public.exchange_rates (currency_code) where tenant_id is null;

alter table public.exchange_rates enable row level security;

-- Global (TCMB) satırlar herkese açık; tenant satırları yalnız o tenant'a
create policy "exchange_rates_select" on public.exchange_rates
  for select to authenticated
  using (tenant_id is null or tenant_id = public.current_tenant_id());

create policy "exchange_rates_manual_upsert" on public.exchange_rates
  for insert to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

create policy "exchange_rates_manual_update" on public.exchange_rates
  for update to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

create policy "exchange_rates_manual_delete" on public.exchange_rates
  for delete to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

-- ---------- ÜRÜN — DÖVİZLİ ALIŞ + FİYAT KURALI ----------

alter table public.products
  add column purchase_currency text not null default 'TRY' references public.currencies(code),
  add column price_margin numeric(6,2),
  add column auto_price boolean not null default false;
