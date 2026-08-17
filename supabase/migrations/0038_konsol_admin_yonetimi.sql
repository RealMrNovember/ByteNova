-- =============================================================
-- ByteNova — 0038_konsol_admin_yonetimi
-- Sprint 6, Gün 30 (3/3): Platform admin davet/rol yönetimi + feature
-- flag yönetim ekranı + eklenti paketi toggle ekranı (Bölüm 64/68).
--
-- Admin daveti, ayrı bir kayıt formu KURMAK yerine mevcut kimlik akışına
-- entegre edildi: master bir e-postaya davet oluşturur; davetli kişi
-- normal yoldan (mevcut hesabıyla ya da /kayit'tan yeni hesap açıp
-- e-postasını doğrulayarak) bir Supabase Auth hesabına sahip olduktan
-- sonra /konsol/giris'e girer — giriş anında bekleyen bir davet varsa
-- otomatik kabul edilir (platform_davet_kabul_et()). Bu, yeni bir
-- şifre-oluşturma formu ve e-posta doğrulama akışını TEKRAR kurmadan aynı
-- güvenlik garantilerini (e-posta doğrulanmış olmalı) sağlıyor.
-- =============================================================

-- ---------- DAVETLER ----------

create table public.platform_admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('master', 'manager', 'finance', 'support', 'analyst')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.platform_admin_invitations enable row level security;

create policy "platform_admin_invitations_select" on public.platform_admin_invitations
  for select using (public.is_platform_admin());

create or replace function public.admin_platform_daveti_olustur(
  p_email text,
  p_role text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role = 'master'
  ) then
    raise exception 'yetkisiz — admin daveti yalnız Master Admin tarafından oluşturulabilir';
  end if;
  if p_role not in ('master', 'manager', 'finance', 'support', 'analyst') then
    raise exception 'geçersiz rol: %', p_role;
  end if;
  if trim(coalesce(p_email, '')) = '' then
    raise exception 'e-posta zorunlu';
  end if;

  insert into public.platform_admin_invitations (email, role, invited_by)
  values (lower(trim(p_email)), p_role, auth.uid())
  returning id into v_id;

  insert into public.platform_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'platform_admin_davet_olusturuldu', 'platform_admin_invitation', v_id::text,
    jsonb_build_object('email', lower(trim(p_email)), 'role', p_role));

  return v_id;
end;
$$;

create or replace function public.admin_platform_davetini_iptal(p_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role = 'master'
  ) then
    raise exception 'yetkisiz';
  end if;

  delete from public.platform_admin_invitations where id = p_id and accepted_at is null;
end;
$$;

-- Davet kabulü: is_platform_admin() kontrolü BİLEREK yok — davetli henüz
-- platform admin değil. Kimlik doğrulaması yalnızca auth.uid()'in geçerli
-- bir oturuma ait olmasıyla sağlanıyor (fonksiyon giriş akışında çağrılır).
create or replace function public.platform_davet_kabul_et()
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_email text;
  v_davet record;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return false;
  end if;

  select * into v_davet from public.platform_admin_invitations
  where lower(email) = lower(v_email) and accepted_at is null and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    return false;
  end if;

  insert into public.platform_admins (id, role, granted_by)
  values (auth.uid(), v_davet.role, v_davet.invited_by)
  on conflict (id) do nothing;

  update public.platform_admin_invitations set accepted_at = now() where id = v_davet.id;

  insert into public.platform_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'platform_admin_davet_kabul_edildi', 'platform_admin_invitation', v_davet.id::text,
    jsonb_build_object('role', v_davet.role));

  return true;
end;
$$;

-- ---------- ROL YÖNETİMİ ----------

create or replace function public.admin_platform_rolunu_degistir(
  p_admin_id uuid,
  p_yeni_rol text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_eski_rol text;
  v_diger_master_sayisi int;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role = 'master'
  ) then
    raise exception 'yetkisiz — yalnız Master Admin rol değiştirebilir';
  end if;
  if p_yeni_rol not in ('master', 'manager', 'finance', 'support', 'analyst') then
    raise exception 'geçersiz rol: %', p_yeni_rol;
  end if;

  select role into v_eski_rol from public.platform_admins where id = p_admin_id;
  if not found then
    raise exception 'admin bulunamadı';
  end if;

  if v_eski_rol = 'master' and p_yeni_rol <> 'master' then
    select count(*) into v_diger_master_sayisi
    from public.platform_admins where role = 'master' and id <> p_admin_id;
    if v_diger_master_sayisi = 0 then
      raise exception 'son Master Admin düşürülemez — önce başka bir Master Admin atayın';
    end if;
  end if;

  update public.platform_admins set role = p_yeni_rol where id = p_admin_id;

  insert into public.platform_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'platform_admin_rolu_degistirildi', 'platform_admin', p_admin_id::text,
    jsonb_build_object('eski_rol', v_eski_rol, 'yeni_rol', p_yeni_rol));
end;
$$;

create or replace function public.admin_platform_admini_kaldir(p_admin_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_rol text;
  v_diger_master_sayisi int;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role = 'master'
  ) then
    raise exception 'yetkisiz — yalnız Master Admin admin kaldırabilir';
  end if;

  select role into v_rol from public.platform_admins where id = p_admin_id;
  if not found then
    raise exception 'admin bulunamadı';
  end if;

  if v_rol = 'master' then
    select count(*) into v_diger_master_sayisi
    from public.platform_admins where role = 'master' and id <> p_admin_id;
    if v_diger_master_sayisi = 0 then
      raise exception 'son Master Admin kaldırılamaz';
    end if;
  end if;

  delete from public.platform_admins where id = p_admin_id;

  insert into public.platform_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'platform_admin_kaldirildi', 'platform_admin', p_admin_id::text,
    jsonb_build_object('rol', v_rol));
end;
$$;

-- ---------- FEATURE FLAG YÖNETİMİ ----------
-- master/manager: platform genel yönetimi. Yalnız GLOBAL (tenant_id null)
-- bayraklar bu ekrandan yönetilir — tek tenant'a özel override zaten
-- doğrudan tabloya yazılabiliyordu (kullanılmıyordu, kapsam dışı kaldı).
-- Yüzde bazlı kademeli açılış BİLİNÇLİ KAPSAM DIŞI — P2.

create or replace function public.admin_flag_ayarla(
  p_key text,
  p_status text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'manager')
  ) then
    raise exception 'yetkisiz';
  end if;
  if p_status not in ('off', 'coming_soon', 'beta', 'on') then
    raise exception 'geçersiz durum: %', p_status;
  end if;

  insert into public.feature_flags (key, status, tenant_id)
  values (p_key, p_status, null)
  on conflict (key, tenant_id) do update set status = excluded.status;

  insert into public.platform_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'feature_flag_ayarlandi', 'feature_flag', p_key, jsonb_build_object('status', p_status));
end;
$$;

-- ---------- EKLENTİ PAKETİ TOGGLE ----------

create or replace function public.admin_paket_durumu_degistir(
  p_key text,
  p_status text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'manager')
  ) then
    raise exception 'yetkisiz';
  end if;
  if p_status not in ('draft', 'available', 'deprecated') then
    raise exception 'geçersiz durum: %', p_status;
  end if;

  update public.addon_packages set status = p_status where key = p_key;
  if not found then
    raise exception 'paket bulunamadı: %', p_key;
  end if;

  insert into public.platform_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'eklenti_paketi_durumu_degistirildi', 'addon_package', p_key, jsonb_build_object('status', p_status));
end;
$$;

-- ---------- LİSTELEME: admin_kullanici_listesi()'ne bekleyen davetler ----------

create or replace function public.admin_platform_admin_listesi()
returns table (
  id uuid,
  email text,
  role text,
  granted_at timestamptz,
  allowed_ips text[]
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'yetkisiz';
  end if;

  return query
  select pa.id, u.email::text, pa.role, pa.granted_at, pa.allowed_ips
  from public.platform_admins pa
  join auth.users u on u.id = pa.id
  order by pa.granted_at;
end;
$$;
