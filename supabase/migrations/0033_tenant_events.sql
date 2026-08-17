-- =============================================================
-- ByteNova — 0033_tenant_events
-- Sprint 6, Gün 28 (2/2): Tenant 360°'nin "olay zaman çizelgesi" temeli
-- (Bölüm 65). Bu tabloya yazan asıl işlemler (uzatma/askıya alma/plan
-- değişikliği/dekont onayı) Gün 29'da eklenecek — bugün yalnızca tablo +
-- okuma tarafı (admin_tenant_detay + tenant detay sayfası) kuruluyor,
-- böylece Gün 29'un RPC'leri doğrudan var olan bu tabloya yazabilecek.
-- platform_audit_logs (0023) ile aynı "konsol eylemi = iki kayıt" deseni
-- korunacak: platform_audit_logs (ByteNova tarafı, teknik detay) +
-- tenant_events (işletme sahibinin de görebileceği, sade özet).
-- =============================================================

create table public.tenant_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'plan_degisti', 'askiya_alindi', 'yeniden_etkinlestirildi', 'uzatildi',
    'dekont_yuklendi', 'dekont_onaylandi', 'dekont_reddedildi', 'kapatildi'
  )),
  description text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index tenant_events_tenant_idx on public.tenant_events (tenant_id, created_at desc);

alter table public.tenant_events enable row level security;

-- Platform adminler her tenant'ın olay geçmişini görebilir (konsol).
create policy "tenant_events_select_admin" on public.tenant_events
  for select using (public.is_platform_admin());

-- İşletme sahibi/yöneticisi KENDİ tenant'ının olaylarını görebilir — Bölüm
-- 65'teki "işletme sahibi 'destek tarafından değiştirildi' kaydını her
-- zaman görebilmeli" şeffaflık ilkesi (kasa kapanışı geri alma ile aynı).
create policy "tenant_events_select_own" on public.tenant_events
  for select using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner', 'manager')
  );

-- ---------- admin_tenant_detay(): olay zaman çizelgesi eklendi ----------
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
    ), '[]'::jsonb),
    'olaylar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', te.id, 'event_type', te.event_type, 'description', te.description,
        'details', te.details, 'admin_email', au.email, 'created_at', te.created_at
      ) order by te.created_at desc)
      from public.tenant_events te
      left join auth.users au on au.id = te.admin_id
      where te.tenant_id = p_tenant_id
      limit 30
    ), '[]'::jsonb)
  ) into sonuc
  from public.tenants t
  where t.id = p_tenant_id;

  return sonuc;
end;
$$;
