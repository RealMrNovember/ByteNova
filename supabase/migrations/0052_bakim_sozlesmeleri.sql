-- Periyodik Bakım Sözleşmeleri (P1) — bkz. PROJE_DOSYASI §27.
-- Kurumsal müşteriyle (okul/şirket) süreli, SLA'lı bir bakım anlaşması: periyodik
-- ziyaretler plan olarak baştan üretilir, teknisyene görev düşer, kapsam dışı iş
-- ayrışır. "Otomatik faturalama günü" bilgi amaçlı bir alan olarak tutulur —
-- sözleşmeden otomatik fatura/satış ÜRETİLMEZ (bilinçli kapsam dışı: finansal
-- belgeler her zaman bir insanın onayıyla, mevcut Satış/Belgeler akışından çıkar).

create table public.sozlesme_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_sozlesme_no(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yil int := extract(year from now());
  sira int;
begin
  insert into public.sozlesme_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, yil, 1)
  on conflict (tenant_id, year)
  do update set last_no = sozlesme_no_counters.last_no + 1
  returning last_no into sira;

  return 'SOZ-' || yil || '-' || lpad(sira::text, 6, '0');
end;
$$;

create table public.maintenance_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contract_no text not null,
  customer_id uuid not null references public.customers(id),
  name text not null,
  scope_description text,
  device_count int,
  period_months int not null default 1 check (period_months > 0),
  monthly_fee numeric(12, 2) not null check (monthly_fee >= 0),
  currency text not null default 'TRY',
  sla_hours int,
  billing_day int check (billing_day between 1 and 28),
  start_date date not null,
  end_date date not null check (end_date > start_date),
  status text not null default 'aktif' check (status in ('aktif', 'suresi_doldu', 'iptal')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, contract_no)
);

create index maintenance_contracts_tenant_status_idx on public.maintenance_contracts (tenant_id, status);
create index maintenance_contracts_end_date_idx on public.maintenance_contracts (end_date) where status = 'aktif';

create table public.contract_visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contract_id uuid not null references public.maintenance_contracts(id) on delete cascade,
  scheduled_date date not null,
  status text not null default 'planlandi' check (status in ('planlandi', 'tamamlandi', 'iptal')),
  technician_id uuid references public.profiles(id),
  visit_report text,
  kapsam_disi_is boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index contract_visits_contract_idx on public.contract_visits (contract_id, scheduled_date);
create index contract_visits_tenant_status_idx on public.contract_visits (tenant_id, status, scheduled_date);

alter table public.maintenance_contracts enable row level security;
alter table public.contract_visits enable row level security;

create policy maintenance_contracts_select on public.maintenance_contracts for select
  using (tenant_id = public.current_tenant_id());
create policy contract_visits_select on public.contract_visits for select
  using (tenant_id = public.current_tenant_id());

-- Tüm yazmalar aşağıdaki RPC'ler üzerinden — ziyaret üretimi tarih hesabı
-- gerektirdiği ve iptal/tamamlama yan etkiler (gelecekteki ziyaretleri de
-- iptal etme) taşıdığı için düz istemci .update()'i yerine RPC tercih edildi.

create or replace function public.bakim_sozlesmesi_olustur(
  p_musteri_id uuid, p_ad text, p_kapsam text, p_cihaz_sayisi int,
  p_periyot_ay int, p_aylik_bedel numeric, p_para_birimi text, p_sla_saat int,
  p_faturalama_gunu int, p_baslangic date, p_bitis date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_contract_id uuid;
  v_no text;
  v_ziyaret_tarihi date;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_bitis <= p_baslangic then
    raise exception 'bitiş tarihi başlangıçtan sonra olmalı';
  end if;

  v_no := public.sonraki_sozlesme_no(v_tenant);

  insert into public.maintenance_contracts
    (tenant_id, contract_no, customer_id, name, scope_description, device_count,
     period_months, monthly_fee, currency, sla_hours, billing_day, start_date, end_date, created_by)
  values
    (v_tenant, v_no, p_musteri_id, p_ad, p_kapsam, p_cihaz_sayisi,
     p_periyot_ay, p_aylik_bedel, p_para_birimi, p_sla_saat, p_faturalama_gunu, p_baslangic, p_bitis, auth.uid())
  returning id into v_contract_id;

  v_ziyaret_tarihi := p_baslangic + (p_periyot_ay || ' months')::interval;
  while v_ziyaret_tarihi <= p_bitis loop
    insert into public.contract_visits (tenant_id, contract_id, scheduled_date)
    values (v_tenant, v_contract_id, v_ziyaret_tarihi);
    v_ziyaret_tarihi := v_ziyaret_tarihi + (p_periyot_ay || ' months')::interval;
  end loop;

  perform public.audit_ekle('sozlesme_olusturuldu', 'maintenance_contract', v_contract_id::text, null,
    jsonb_build_object('no', v_no, 'musteri_id', p_musteri_id, 'aylik_bedel', p_aylik_bedel));

  return v_contract_id;
end;
$$;

create or replace function public.sozlesme_iptal_et(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.maintenance_contracts set status = 'iptal'
  where id = p_contract_id and tenant_id = v_tenant and status = 'aktif';
  if not found then
    raise exception 'sözleşme bulunamadı veya zaten kapalı';
  end if;

  update public.contract_visits set status = 'iptal'
  where contract_id = p_contract_id and tenant_id = v_tenant and status = 'planlandi';

  perform public.audit_ekle('sozlesme_iptal_edildi', 'maintenance_contract', p_contract_id::text, null, null);
end;
$$;

create or replace function public.sozlesme_ziyaret_tamamla(p_visit_id uuid, p_rapor text, p_kapsam_disi boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_ziyaret record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select * into v_ziyaret from public.contract_visits where id = p_visit_id and tenant_id = v_tenant;
  if not found then
    raise exception 'ziyaret bulunamadı';
  end if;
  if v_ziyaret.status <> 'planlandi' then
    raise exception 'bu ziyaret zaten kapanmış';
  end if;

  update public.contract_visits
  set status = 'tamamlandi', visit_report = p_rapor, kapsam_disi_is = p_kapsam_disi,
      completed_at = now(), technician_id = coalesce(technician_id, auth.uid())
  where id = p_visit_id;

  perform public.audit_ekle('sozlesme_ziyareti_tamamlandi', 'contract_visit', p_visit_id::text, null,
    jsonb_build_object('kapsam_disi', p_kapsam_disi));
end;
$$;

create or replace function public.sozlesme_ziyaret_teknisyen_ata(p_visit_id uuid, p_teknisyen_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.contract_visits set technician_id = p_teknisyen_id
  where id = p_visit_id and tenant_id = v_tenant and status = 'planlandi';
  if not found then
    raise exception 'ziyaret bulunamadı veya zaten kapanmış';
  end if;
end;
$$;
