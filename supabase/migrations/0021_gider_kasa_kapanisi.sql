-- =============================================================
-- ByteNova — 0021_gider_kasa_kapanisi
-- Gider modülü (kategoriler, fiş fotoğrafı, tekrarlayan gider) +
-- kasa kapanışı (beklenen/fiili, fark + zorunlu açıklama).
-- =============================================================

-- ---------- GİDERLER ----------

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category text not null check (category in (
    'kira', 'fatura', 'maas', 'yemek', 'kargo', 'pos_komisyonu',
    'dis_servis', 'sarf', 'vergi_harc', 'diger'
  )),
  description text,
  amount numeric(12,2) not null check (amount > 0),
  account_id uuid not null references public.cash_accounts(id) on delete restrict,
  is_recurring boolean not null default false,
  recurrence_day int check (recurrence_day between 1 and 31),
  receipt_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index expenses_tenant_idx on public.expenses (tenant_id, created_at desc);
create index expenses_recurring_idx on public.expenses (tenant_id, category, description) where is_recurring;

alter table public.expenses enable row level security;

create policy "expenses_select" on public.expenses
  for select using (tenant_id = public.current_tenant_id());

-- İçeri yazma yalnız aşağıdaki RPC üzerinden olur (kasa hareketiyle birlikte).

create or replace function public.gider_ekle(
  p_category text,
  p_description text,
  p_amount numeric,
  p_account_id uuid,
  p_is_recurring boolean default false,
  p_recurrence_day int default null,
  p_receipt_path text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_amount <= 0 then
    raise exception 'tutar sıfırdan büyük olmalı';
  end if;

  insert into public.expenses
    (tenant_id, category, description, amount, account_id, is_recurring, recurrence_day, receipt_path, created_by)
  values
    (v_tenant, p_category, nullif(trim(p_description), ''), p_amount, p_account_id,
     p_is_recurring, p_recurrence_day, p_receipt_path, auth.uid())
  returning id into v_id;

  perform public.kasa_hareketi_ekle(
    p_account_id, -p_amount, 'odeme', 'expense', v_id::text,
    'Gider: ' || p_category || coalesce(' — ' || p_description, '')
  );

  perform public.audit_ekle(
    'gider_eklendi', 'expense', v_id::text, null,
    jsonb_build_object('category', p_category, 'amount', p_amount)
  );

  return v_id;
end;
$$;

-- ---------- KASA KAPANIŞI ----------

create table public.cash_closings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_id uuid not null references public.cash_accounts(id) on delete restrict,
  closing_date date not null,
  expected_balance numeric(12,2) not null,
  actual_balance numeric(12,2) not null,
  difference numeric(12,2) not null,
  explanation text,
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz not null default now(),
  unique (account_id, closing_date)
);

create index cash_closings_tenant_idx on public.cash_closings (tenant_id, closing_date desc);

alter table public.cash_closings enable row level security;

create policy "cash_closings_select" on public.cash_closings
  for select using (tenant_id = public.current_tenant_id());

create or replace function public.kasa_kapat(
  p_account_id uuid,
  p_fiili_bakiye numeric,
  p_aciklama text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_beklenen numeric;
  v_fark numeric;
  v_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select balance into v_beklenen
  from public.cash_accounts
  where id = p_account_id and tenant_id = v_tenant and is_active = true
  for update;

  if not found then
    raise exception 'kasa hesabı bulunamadı veya erişim yok';
  end if;

  if exists (
    select 1 from public.cash_closings
    where account_id = p_account_id and closing_date = current_date
  ) then
    raise exception 'bu hesap bugün zaten kapatıldı';
  end if;

  v_fark := p_fiili_bakiye - v_beklenen;

  if v_fark <> 0 and (p_aciklama is null or trim(p_aciklama) = '') then
    raise exception 'FARK_ACIKLAMASI_GEREKLI: beklenen %, fiili %', v_beklenen, p_fiili_bakiye;
  end if;

  insert into public.cash_closings
    (tenant_id, account_id, closing_date, expected_balance, actual_balance, difference, explanation, closed_by)
  values
    (v_tenant, p_account_id, current_date, v_beklenen, p_fiili_bakiye, v_fark, nullif(trim(p_aciklama), ''), auth.uid())
  returning id into v_id;

  if v_fark <> 0 then
    perform public.kasa_hareketi_ekle(
      p_account_id, v_fark, 'duzeltme', 'cash_closing', v_id::text,
      'Kasa kapanış farkı: ' || p_aciklama
    );
  end if;

  perform public.audit_ekle(
    'kasa_kapatildi', 'cash_closing', v_id::text, null,
    jsonb_build_object('expected', v_beklenen, 'actual', p_fiili_bakiye, 'difference', v_fark)
  );

  return v_id;
end;
$$;
