-- =============================================================
-- ByteNova — 0010_konsol_v0
-- Platform Yönetim Konsolu — temel (Bölüm 63-68'in ilk katmanı)
-- NOT: Bu, Bölüm 63'teki TAM ayrı-kimlik/MFA-zorunlu Konsol mimarisinin
-- öncüsüdür. platform_admins tablosu ve güvenlik deseni (RLS'i gevşetmek
-- yerine SECURITY DEFINER fonksiyonlarla ek yetki) ileride (Gün 28-30)
-- MFA + tam ayrı yüzeyle güçlendirilecek — bu adım o işi tekrar
-- gerektirmeyecek şekilde kuruldu.
-- =============================================================

create table public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'master'
    check (role in ('master','manager','finance','support','analyst')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);

alter table public.platform_admins enable row level security;

create policy "platform_admins_select_self" on public.platform_admins
  for select using (id = auth.uid());

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(select 1 from public.platform_admins where id = auth.uid());
$$;

-- ---------- İLK MASTER ADMIN (kullanıcı talebi, 14.08.2026) ----------

insert into public.platform_admins (id, role)
select id, 'master' from auth.users where email = 'mozkarci1991@gmail.com'
on conflict (id) do nothing;

-- ---------- KONSOL RPC'LERİ ----------
-- Tenant RLS politikaları asla gevşetilmez; çapraz-tenant erişim yalnız
-- bu SECURITY DEFINER fonksiyonlar üzerinden, is_platform_admin() kontrolüyle.

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
  kullanici_sayisi bigint
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
    (select count(*) from public.profiles p2 where p2.tenant_id = t.id) as kullanici_sayisi
  from public.tenants t
  left join public.profiles p_owner on p_owner.tenant_id = t.id and p_owner.role = 'owner'
  left join auth.users u on u.id = p_owner.id
  order by t.created_at desc;
end;
$$;

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
    'servis_sayisi', (select count(*) from public.service_orders so where so.tenant_id = p_tenant_id)
  ) into sonuc
  from public.tenants t
  where t.id = p_tenant_id;

  return sonuc;
end;
$$;
