-- =============================================================
-- ByteNova — 0034_abonelik_planlari
-- Sprint 6, Gün 29: Abonelik planları + yaşam döngüsü + Konsol'dan
-- müdahale + manuel ödeme (dekont) akışı (Bölüm 65-66).
--
-- Kapsam (kullanıcı talebiyle netleştirildi, 17.08.2026): plan kataloğu +
-- tenant'a atama, Trial→Aktif→Ödeme Bekliyor→Askıda yaşam döngüsü +
-- otomatik geçiş, konsoldan uzatma/durum değiştirme/plan değiştirme
-- (gerekçeli, iki yerde audit), dekont yükle→onayla akışı.
-- Otomatik/online tahsilat (BillingProvider) BİLİNÇLİ KAPSAM DIŞI —
-- Sprint 9-12'ye planlı; bugün yalnız planların tanımı ve manuel/idari
-- yönetimi kapsanıyor.
-- =============================================================

-- ---------- PLAN KATALOĞU ----------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  monthly_price numeric(12,2) not null,
  yearly_price numeric(12,2) not null,
  max_users int, -- null = sınırsız
  included_addon_keys text[] not null default '{}', -- bu plana dahil, ayrıca ödeme gerektirmeyen eklentiler
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;

-- Fiyatlandırma bilgisi hassas değil — her giriş yapmış kullanıcı katalog
-- listesini görebilir (Ayarlar > Abonelik'te kendi planını karşılaştırmak
-- için gereken diğer planları da görür).
create policy "subscription_plans_select" on public.subscription_plans
  for select to authenticated using (true);

insert into public.subscription_plans (key, name, monthly_price, yearly_price, max_users, included_addon_keys, sort_order)
values
  ('baslangic', 'Başlangıç', 499, 4990, 1, '{}', 1),
  ('profesyonel', 'Profesyonel', 899, 8990, 5, array['crm_plus'], 2),
  ('kurumsal', 'Kurumsal', 1499, 14990, null, array['crm_plus', 'whatsapp_sms', 'kurumsal_satis'], 3);

-- ---------- TENANT: PLAN + FATURALAMA DÖNGÜSÜ ----------

alter table public.tenants
  add column plan_id uuid references public.subscription_plans(id),
  add column billing_cycle text check (billing_cycle in ('aylik', 'yillik'));

-- Mevcut (öncesi) tüm tenant'lar varsayılan olarak Başlangıç/aylık alır —
-- henüz hiçbir tenant'tan ücret tahsil edilmiyor, bu yalnızca Ayarlar >
-- Abonelik ekranında gösterilecek bir başlangıç değeri.
update public.tenants
set plan_id = (select id from public.subscription_plans where key = 'baslangic'),
    billing_cycle = 'aylik'
where plan_id is null;

-- ---------- MANUEL ÖDEME (DEKONT) ----------

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_path text not null,
  amount numeric(12,2),
  note text,
  status text not null default 'bekliyor' check (status in ('bekliyor', 'onaylandi', 'reddedildi')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index payment_receipts_tenant_idx on public.payment_receipts (tenant_id, created_at desc);

alter table public.payment_receipts enable row level security;

create policy "payment_receipts_select_own" on public.payment_receipts
  for select using (tenant_id = public.current_tenant_id());

-- Konsol tarafı erişimi RLS gevşetilerek değil, aşağıdaki SECURITY DEFINER
-- fonksiyonlar üzerinden — tenant RLS deseni hep bu şekilde korunuyor.

create or replace function public.dekont_yukle(
  p_storage_path text,
  p_tutar numeric default null,
  p_not text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  insert into public.payment_receipts (tenant_id, uploaded_by, storage_path, amount, note)
  values (v_tenant, auth.uid(), p_storage_path, p_tutar, nullif(trim(coalesce(p_not, '')), ''))
  returning id into v_id;

  perform public.audit_ekle(
    'dekont_yuklendi', 'payment_receipt', v_id::text, null,
    jsonb_build_object('tutar', p_tutar)
  );

  return v_id;
end;
$$;

-- ---------- tenant_events: yeni olay tipi (otomatik deneme bitişi) ----------

alter table public.tenant_events drop constraint tenant_events_event_type_check;
alter table public.tenant_events add constraint tenant_events_event_type_check
  check (event_type in (
    'plan_degisti', 'askiya_alindi', 'yeniden_etkinlestirildi', 'uzatildi',
    'dekont_yuklendi', 'dekont_onaylandi', 'dekont_reddedildi', 'kapatildi',
    'deneme_bitti'
  ));

-- ---------- KONSOL: TENANT'A MÜDAHALE RPC'LERİ ----------
-- Rol ayrımı Bölüm 64'teki platform rolleri tablosuna göre:
--   master/manager  → uzatma, durum değiştirme
--   master/manager/finance → plan/dönem değiştirme
--   master/finance  → dekont onay/red

create or replace function public.admin_tenant_uzat(
  p_tenant_id uuid,
  p_yeni_bitis timestamptz,
  p_gerekce text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_eski_bitis timestamptz;
  v_eski_durum text;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'manager')
  ) then
    raise exception 'yetkisiz — bu işlem yalnız master/manager platform rolüne açık';
  end if;
  if trim(coalesce(p_gerekce, '')) = '' then
    raise exception 'gerekçe zorunlu';
  end if;
  if p_yeni_bitis <= now() then
    raise exception 'yeni bitiş tarihi gelecekte olmalı';
  end if;

  select trial_ends_at, status into v_eski_bitis, v_eski_durum
  from public.tenants where id = p_tenant_id;
  if not found then
    raise exception 'tenant bulunamadı';
  end if;

  update public.tenants
  set trial_ends_at = p_yeni_bitis,
      status = case when status in ('past_due', 'suspended') then 'trial' else status end
  where id = p_tenant_id;

  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id, details)
  values (
    auth.uid(), 'tenant_uzatildi', p_tenant_id, 'tenant', p_tenant_id::text,
    jsonb_build_object('eski_bitis', v_eski_bitis, 'yeni_bitis', p_yeni_bitis, 'gerekce', p_gerekce)
  );

  insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
  values (
    p_tenant_id, auth.uid(), 'uzatildi',
    'Süre uzatıldı: ' || to_char(p_yeni_bitis, 'DD.MM.YYYY') || ' — ' || p_gerekce,
    jsonb_build_object('eski_bitis', v_eski_bitis, 'yeni_bitis', p_yeni_bitis)
  );
end;
$$;

create or replace function public.admin_tenant_durum_degistir(
  p_tenant_id uuid,
  p_yeni_durum text,
  p_gerekce text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_eski_durum text;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'manager')
  ) then
    raise exception 'yetkisiz — bu işlem yalnız master/manager platform rolüne açık';
  end if;
  if p_yeni_durum not in ('active', 'suspended') then
    raise exception 'geçersiz durum: %', p_yeni_durum;
  end if;
  if p_yeni_durum = 'suspended' and trim(coalesce(p_gerekce, '')) = '' then
    raise exception 'askıya alma için gerekçe zorunlu';
  end if;

  select status into v_eski_durum from public.tenants where id = p_tenant_id;
  if not found then
    raise exception 'tenant bulunamadı';
  end if;

  update public.tenants set status = p_yeni_durum where id = p_tenant_id;

  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id, details)
  values (
    auth.uid(), 'tenant_durum_degistirildi', p_tenant_id, 'tenant', p_tenant_id::text,
    jsonb_build_object('eski_durum', v_eski_durum, 'yeni_durum', p_yeni_durum, 'gerekce', p_gerekce)
  );

  insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
  values (
    p_tenant_id, auth.uid(),
    case when p_yeni_durum = 'suspended' then 'askiya_alindi' else 'yeniden_etkinlestirildi' end,
    case when p_yeni_durum = 'suspended'
      then 'Askıya alındı — ' || p_gerekce
      else 'Yeniden etkinleştirildi'
    end,
    jsonb_build_object('eski_durum', v_eski_durum, 'yeni_durum', p_yeni_durum)
  );
end;
$$;

create or replace function public.admin_tenant_plan_degistir(
  p_tenant_id uuid,
  p_plan_id uuid,
  p_donem text,
  p_gerekce text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_eski_plan_id uuid;
  v_eski_donem text;
  v_eski_ad text;
  v_yeni_ad text;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'manager', 'finance')
  ) then
    raise exception 'yetkisiz — bu işlem yalnız master/manager/finance platform rolüne açık';
  end if;
  if p_donem not in ('aylik', 'yillik') then
    raise exception 'geçersiz dönem: %', p_donem;
  end if;
  if trim(coalesce(p_gerekce, '')) = '' then
    raise exception 'gerekçe zorunlu';
  end if;
  if not exists (select 1 from public.subscription_plans where id = p_plan_id and is_active) then
    raise exception 'geçersiz plan';
  end if;

  select plan_id, billing_cycle into v_eski_plan_id, v_eski_donem
  from public.tenants where id = p_tenant_id;
  if not found then
    raise exception 'tenant bulunamadı';
  end if;

  select name into v_eski_ad from public.subscription_plans where id = v_eski_plan_id;
  select name into v_yeni_ad from public.subscription_plans where id = p_plan_id;

  update public.tenants set plan_id = p_plan_id, billing_cycle = p_donem where id = p_tenant_id;

  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id, details)
  values (
    auth.uid(), 'tenant_plani_degistirildi', p_tenant_id, 'tenant', p_tenant_id::text,
    jsonb_build_object(
      'eski_plan_id', v_eski_plan_id, 'yeni_plan_id', p_plan_id,
      'eski_donem', v_eski_donem, 'yeni_donem', p_donem, 'gerekce', p_gerekce
    )
  );

  insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
  values (
    p_tenant_id, auth.uid(), 'plan_degisti',
    coalesce(v_eski_ad, '—') || ' → ' || v_yeni_ad || ' (' ||
      case p_donem when 'aylik' then 'aylık' else 'yıllık' end || ') — ' || p_gerekce,
    jsonb_build_object('eski_plan_id', v_eski_plan_id, 'yeni_plan_id', p_plan_id)
  );
end;
$$;

create or replace function public.admin_dekont_onayla(
  p_receipt_id uuid,
  p_not text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'finance')
  ) then
    raise exception 'yetkisiz — bu işlem yalnız master/finance platform rolüne açık';
  end if;

  select tenant_id into v_tenant from public.payment_receipts
  where id = p_receipt_id and status = 'bekliyor';
  if not found then
    raise exception 'dekont bulunamadı veya zaten karara bağlanmış';
  end if;

  update public.payment_receipts
  set status = 'onaylandi', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_not
  where id = p_receipt_id;

  update public.tenants set status = 'active' where id = v_tenant;

  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id, details)
  values (auth.uid(), 'dekont_onaylandi', v_tenant, 'payment_receipt', p_receipt_id::text, jsonb_build_object('not', p_not));

  insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
  values (v_tenant, auth.uid(), 'dekont_onaylandi', 'Ödeme dekontu onaylandı, abonelik aktif edildi', jsonb_build_object('receipt_id', p_receipt_id));
end;
$$;

create or replace function public.admin_dekont_reddet(
  p_receipt_id uuid,
  p_gerekce text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  if not exists (
    select 1 from public.platform_admins where id = auth.uid() and role in ('master', 'finance')
  ) then
    raise exception 'yetkisiz — bu işlem yalnız master/finance platform rolüne açık';
  end if;
  if trim(coalesce(p_gerekce, '')) = '' then
    raise exception 'red gerekçesi zorunlu';
  end if;

  select tenant_id into v_tenant from public.payment_receipts
  where id = p_receipt_id and status = 'bekliyor';
  if not found then
    raise exception 'dekont bulunamadı veya zaten karara bağlanmış';
  end if;

  update public.payment_receipts
  set status = 'reddedildi', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_gerekce
  where id = p_receipt_id;

  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id, details)
  values (auth.uid(), 'dekont_reddedildi', v_tenant, 'payment_receipt', p_receipt_id::text, jsonb_build_object('gerekce', p_gerekce));

  insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
  values (v_tenant, auth.uid(), 'dekont_reddedildi', 'Ödeme dekontu reddedildi — ' || p_gerekce, jsonb_build_object('receipt_id', p_receipt_id));
end;
$$;

-- ---------- admin_tenant_detay(): plan + dekontlar eklendi ----------
-- İmza değişmiyor — düz create-or-replace güvenli.

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
    'plan', (select to_jsonb(sp.*) from public.subscription_plans sp where sp.id = t.plan_id),
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
    ), '[]'::jsonb),
    'dekontlar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pr.id, 'storage_path', pr.storage_path, 'amount', pr.amount, 'note', pr.note,
        'status', pr.status, 'review_note', pr.review_note, 'created_at', pr.created_at,
        'reviewed_at', pr.reviewed_at
      ) order by pr.created_at desc)
      from public.payment_receipts pr
      where pr.tenant_id = p_tenant_id
      limit 20
    ), '[]'::jsonb)
  ) into sonuc
  from public.tenants t
  where t.id = p_tenant_id;

  return sonuc;
end;
$$;
