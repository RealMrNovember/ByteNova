-- =============================================================
-- ByteNova — 0026_konsol_kullanici_ve_loglar
-- Konsol v1'e üç parça ekleniyor (kullanıcı talebi, 16.08.2026):
--   1) admin_kullanici_listesi() — sisteme kayıtlı/giriş yapan HERKESİN
--      tek listesi (tenant sınırı olmadan) — Konsol → Kullanıcılar
--   2) admin_tenant_listesi() — her işletmenin aktif eklenti sayısı
--      eklendi (paketleri tek bakışta görmek için)
--   3) admin_sistem_loglari() — platform_audit_logs (ByteNova tarafı)
--      ile TÜM tenant'ların audit_logs'unu tek zaman çizelgesinde
--      birleştiren, arama/filtre destekli RPC — Konsol → Sistem Logları
-- Tenant RLS politikaları burada da gevşetilmiyor; erişim yalnızca
-- is_platform_admin() kontrollü SECURITY DEFINER fonksiyonlar üzerinden.
-- =============================================================

-- ---------- 1) TÜM KULLANICILAR ----------

create or replace function public.admin_kullanici_listesi()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  tenant_id uuid,
  tenant_name text,
  tenant_status text,
  platform_rolu text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'yetkisiz';
  end if;

  return query
  select
    p.id, u.email::text, p.full_name, p.role,
    p.tenant_id, t.name as tenant_name, t.status as tenant_status,
    pa.role as platform_rolu,
    p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  join public.tenants t on t.id = p.tenant_id
  left join public.platform_admins pa on pa.id = p.id
  order by p.created_at desc;
end;
$$;

-- ---------- 2) TENANT LİSTESİ: aktif eklenti sayısı ----------
-- Çıktı sütun listesi değişiyor (yeni kolon ekleniyor) — Postgres bu
-- durumda CREATE OR REPLACE'e izin vermez, önce açıkça düşürülüyor.

drop function if exists public.admin_tenant_listesi();

create or replace function public.admin_tenant_listesi()
returns table (
  id uuid,
  name text,
  status text,
  phone text,
  trial_ends_at timestamptz,
  created_at timestamptz,
  owner_email text,
  owner_name text,
  kullanici_sayisi bigint,
  aktif_eklenti_sayisi bigint
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'yetkisiz';
  end if;

  return query
  select
    t.id, t.name, t.status, t.phone, t.trial_ends_at, t.created_at,
    u.email::text as owner_email,
    p_owner.full_name as owner_name,
    (select count(*) from public.profiles p2 where p2.tenant_id = t.id) as kullanici_sayisi,
    (select count(*) from public.tenant_addon_subscriptions tas
      where tas.tenant_id = t.id and tas.status in ('trial', 'active')) as aktif_eklenti_sayisi
  from public.tenants t
  left join public.profiles p_owner on p_owner.tenant_id = t.id and p_owner.role = 'owner'
  left join auth.users u on u.id = p_owner.id
  order by t.created_at desc;
end;
$$;

-- ---------- TENANT DETAYI: eklenti listesi eklendi ----------
-- İmza değişmiyor (hâlâ p_tenant_id uuid → jsonb) — düz create-or-replace
-- güvenli.

create or replace function public.admin_tenant_detay(p_tenant_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  sonuc jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'yetkisiz';
  end if;

  select jsonb_build_object(
    'tenant', to_jsonb(t.*),
    'kullanicilar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'full_name', p.full_name, 'role', p.role,
        'email', u.email, 'created_at', p.created_at
      ) order by p.created_at)
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.tenant_id = p_tenant_id
    ), '[]'::jsonb),
    'musteri_sayisi', (select count(*) from public.customers c where c.tenant_id = p_tenant_id),
    'cihaz_sayisi', (select count(*) from public.devices d where d.tenant_id = p_tenant_id),
    'servis_sayisi', (select count(*) from public.service_orders so where so.tenant_id = p_tenant_id),
    'kasa_kapanislari', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cc.id, 'account_id', cc.account_id, 'account_name', ca.name,
        'closing_date', cc.closing_date, 'expected_balance', cc.expected_balance,
        'actual_balance', cc.actual_balance, 'difference', cc.difference,
        'explanation', cc.explanation, 'closed_at', cc.closed_at,
        'reversed_at', cc.reversed_at, 'reversal_reason', cc.reversal_reason
      ) order by cc.closed_at desc)
      from public.cash_closings cc
      join public.cash_accounts ca on ca.id = cc.account_id
      where cc.tenant_id = p_tenant_id
      limit 20
    ), '[]'::jsonb),
    'eklentiler', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', ap.key, 'name', ap.name, 'icon', ap.icon,
        'status', tas.status, 'activated_at', tas.activated_at,
        'trial_ends_at', tas.trial_ends_at, 'cancelled_at', tas.cancelled_at
      ) order by tas.activated_at desc)
      from public.tenant_addon_subscriptions tas
      join public.addon_packages ap on ap.key = tas.addon_key
      where tas.tenant_id = p_tenant_id
    ), '[]'::jsonb)
  ) into sonuc
  from public.tenants t
  where t.id = p_tenant_id;

  return sonuc;
end;
$$;

-- ---------- 3) SİSTEM LOGLARI (platform + tüm tenant'lar birleşik) ----------

create or replace function public.admin_sistem_loglari(
  p_limit int default 100,
  p_tenant_id uuid default null,
  p_arama text default null
)
returns table (
  kaynak text,
  kayit_id text,
  created_at timestamptz,
  tenant_id uuid,
  tenant_name text,
  aktor_email text,
  aktor_ad text,
  action text,
  entity text,
  entity_id text,
  detay jsonb
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'yetkisiz';
  end if;

  return query
  select birlesik.*
  from (
    select
      'platform'::text as kaynak,
      pal.id::text as kayit_id,
      pal.created_at,
      pal.target_tenant_id as tenant_id,
      t.name as tenant_name,
      u.email::text as aktor_email,
      null::text as aktor_ad,
      pal.action,
      pal.entity,
      pal.entity_id,
      pal.details as detay
    from public.platform_audit_logs pal
    left join public.tenants t on t.id = pal.target_tenant_id
    left join auth.users u on u.id = pal.admin_id

    union all

    select
      'tenant'::text as kaynak,
      al.id::text as kayit_id,
      al.created_at,
      al.tenant_id,
      t2.name as tenant_name,
      u2.email::text as aktor_email,
      p.full_name as aktor_ad,
      al.action,
      al.entity,
      al.entity_id,
      jsonb_build_object('old', al.old_value, 'new', al.new_value, 'reason', al.reason) as detay
    from public.audit_logs al
    join public.tenants t2 on t2.id = al.tenant_id
    left join auth.users u2 on u2.id = al.user_id
    left join public.profiles p on p.id = al.user_id
  ) birlesik
  where (p_tenant_id is null or birlesik.tenant_id = p_tenant_id)
    and (
      p_arama is null or trim(p_arama) = '' or
      birlesik.action ilike '%' || p_arama || '%' or
      birlesik.aktor_email ilike '%' || p_arama || '%' or
      birlesik.tenant_name ilike '%' || p_arama || '%'
    )
  order by birlesik.created_at desc
  limit greatest(p_limit, 1);
end;
$$;
