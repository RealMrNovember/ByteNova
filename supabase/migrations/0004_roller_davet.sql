-- =============================================================
-- ByteNova — 0004_roller_davet
-- Şubeler, kullanıcı davetleri, rol yönetimi ve audit fonksiyonu
-- =============================================================

-- ---------- ROL YARDIMCISI ----------
-- security definer: policy içinde recursion olmadan mevcut kullanıcının rolü

create or replace function public.rol_su()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---------- ŞUBELER ----------

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null default 'Merkez',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index branches_tenant_idx on public.branches (tenant_id);

alter table public.branches enable row level security;

create policy "branches_select" on public.branches
  for select using (tenant_id = public.current_tenant_id());

create policy "branches_write_admin" on public.branches
  for all using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  ) with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

-- Mevcut tenant'lara varsayılan şube
insert into public.branches (tenant_id, name, is_default)
select id, 'Merkez', true
from public.tenants t
where not exists (select 1 from public.branches b where b.tenant_id = t.id);

-- Yeni kayıt tetikleyicisi: artık varsayılan şube de açar
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

  insert into public.branches (tenant_id, name, is_default)
  values (new_tenant_id, 'Merkez', true);

  return new;
end;
$$;

-- ---------- DAVETLER ----------

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'technician'
    check (role in ('manager','cashier','technician','warehouse','accounting')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "inv_admin_select" on public.invitations
  for select using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

create policy "inv_admin_insert" on public.invitations
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

create policy "inv_admin_delete" on public.invitations
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

-- ---------- ROL YÖNETİMİ ----------
-- Sahip, kendi tenant'ındaki profilleri güncelleyebilir (rol atama)

create policy "profiles_update_owner" on public.profiles
  for update using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() = 'owner'
  );

-- ---------- AUDIT FONKSİYONU ----------

create or replace function public.audit_ekle(
  p_action text,
  p_entity text default null,
  p_entity_id text default null,
  p_old jsonb default null,
  p_new jsonb default null,
  p_reason text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.audit_logs
    (tenant_id, user_id, action, entity, entity_id, old_value, new_value, reason)
  values
    (public.current_tenant_id(), auth.uid(), p_action, p_entity, p_entity_id, p_old, p_new, p_reason);
end;
$$;

-- ---------- DAVET KABUL ----------
-- Davetli kullanıcı: kendi (boş) tenant'ından davet eden işletmeye taşınır.

create or replace function public.daveti_kabul_et(p_token uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  inv record;
  eski_tenant uuid;
  kalan int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'hata', 'oturum_yok');
  end if;

  select * into inv
  from public.invitations
  where token = p_token and accepted_at is null and expires_at > now();

  if not found then
    return jsonb_build_object('ok', false, 'hata', 'davet_gecersiz');
  end if;

  if lower(inv.email) <> lower(coalesce(auth.jwt()->>'email', '')) then
    return jsonb_build_object('ok', false, 'hata', 'eposta_uyusmuyor');
  end if;

  select tenant_id into eski_tenant from public.profiles where id = auth.uid();

  update public.profiles
  set tenant_id = inv.tenant_id, role = inv.role
  where id = auth.uid();

  update public.invitations set accepted_at = now() where id = inv.id;

  -- Eski tenant boş kaldıysa temizle
  if eski_tenant is not null and eski_tenant <> inv.tenant_id then
    select count(*) into kalan from public.profiles where tenant_id = eski_tenant;
    if kalan = 0 then
      delete from public.tenants where id = eski_tenant;
    end if;
  end if;

  insert into public.audit_logs (tenant_id, user_id, action, entity, entity_id)
  values (inv.tenant_id, auth.uid(), 'davet_kabul', 'invitation', inv.id::text);

  return jsonb_build_object('ok', true);
end;
$$;
