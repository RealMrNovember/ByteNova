-- =============================================================
-- ByteNova — 0023_konsol_kasa_kapanis_geri_alma
-- Bir işletme kasasını yanlışlıkla kapatırsa (gün sonu alırsa), kendi
-- kullanıcıları bunu GERİ ALAMAZ (denetim bütünlüğü — kapanış immutable
-- kalmalı). Yalnızca ByteNova platform admin'i (master/finance rolü),
-- gerekçe girerek, konsoldan geri alabilir. İşlem hem platform_audit_logs
-- (ByteNova tarafı) hem tenant'ın kendi audit_logs'una (şeffaflık —
-- işletme sahibi "destek tarafından düzeltildi" kaydını görebilmeli)
-- işlenir. Kapanış satırı asla silinmez, "reversed_*" alanlarıyla
-- işaretlenir — finansal kayıtlar hard delete edilmez.
-- =============================================================

-- ---------- PLATFORM AUDIT LOG ----------

create table public.platform_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_tenant_id uuid references public.tenants(id) on delete set null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_audit_logs enable row level security;

create policy "platform_audit_logs_select" on public.platform_audit_logs
  for select using (public.is_platform_admin());

-- ---------- KASA KAPANIŞI: GERİ ALINABİLİR HALE GETİR ----------
-- Eski "günde bir kapanış" kısıtı artık yalnız aktif (iptal edilmemiş)
-- kapanışlar için geçerli — geri alınan bir kapanışın yerine aynı gün
-- için yeni bir kapanış yapılabilsin diye.

alter table public.cash_closings
  add column reversed_at timestamptz,
  add column reversed_by uuid references auth.users(id) on delete set null,
  add column reversal_reason text;

alter table public.cash_closings
  drop constraint cash_closings_account_id_closing_date_key;

create unique index cash_closings_active_unique
  on public.cash_closings (account_id, closing_date)
  where reversed_at is null;

-- kasa_kapat(): "bugün zaten kapatıldı" kontrolü artık yalnız aktif
-- kapanışlara bakıyor (geri alınmış bir kapanış tekrar kapatmayı
-- engellememeli).
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
  v_bugun date;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  v_bugun := (now() at time zone 'Europe/Istanbul')::date;

  select balance into v_beklenen
  from public.cash_accounts
  where id = p_account_id and tenant_id = v_tenant and is_active = true
  for update;

  if not found then
    raise exception 'kasa hesabı bulunamadı veya erişim yok';
  end if;

  if exists (
    select 1 from public.cash_closings
    where account_id = p_account_id and closing_date = v_bugun and reversed_at is null
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
    (v_tenant, p_account_id, v_bugun, v_beklenen, p_fiili_bakiye, v_fark, nullif(trim(p_aciklama), ''), auth.uid())
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

-- ---------- kasa_hareketi_ekle(): platform admin adına hareket edebilme ----------
-- p_admin_tenant_id doluysa (yalnız is_platform_admin() ile doğrulanarak
-- kullanılabilir) current_tenant_id()/rol_su() yerine belirtilen tenant
-- üzerinde işlem yapılır — bir platform admin'in kendi tenant'ı/rolü
-- olmadığı için normal akış onun adına hareket ekleyemez.
-- Önceki 6 parametreli sürüm burada tamamen yerini alıyor; overload
-- çakışmasını önlemek için önce açıkça düşürülüyor (bkz. Gün 15/16).

drop function if exists public.kasa_hareketi_ekle(uuid, numeric, text, text, text, text);

create or replace function public.kasa_hareketi_ekle(
  p_account_id uuid,
  p_degisim numeric,
  p_tip text,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_neden text default null,
  p_admin_tenant_id uuid default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_once numeric;
  v_sonra numeric;
begin
  if p_admin_tenant_id is not null then
    if not public.is_platform_admin() then
      raise exception 'yetkisiz';
    end if;
    v_tenant := p_admin_tenant_id;
  else
    v_tenant := public.current_tenant_id();
    if public.rol_su() not in ('owner', 'manager', 'cashier') then
      raise exception 'bu işlem için yetkiniz yok';
    end if;
  end if;

  select balance into v_once
  from public.cash_accounts
  where id = p_account_id and tenant_id = v_tenant and is_active = true
  for update;

  if not found then
    raise exception 'kasa hesabı bulunamadı veya erişim yok';
  end if;

  v_sonra := v_once + p_degisim;

  update public.cash_accounts
  set balance = v_sonra
  where id = p_account_id;

  insert into public.cash_movements
    (tenant_id, account_id, movement_type, amount, balance_before, balance_after,
     reference_type, reference_id, reason, created_by)
  values
    (v_tenant, p_account_id, p_tip, p_degisim, v_once, v_sonra,
     p_referans_tip, p_referans_id, p_neden, auth.uid());

  return v_sonra;
end;
$$;

-- ---------- KAPANIŞ GERİ ALMA (yalnız master/finance platform rolü) ----------

create or replace function public.admin_kasa_kapanisini_geri_al(
  p_closing_id uuid,
  p_neden text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_kapanis record;
begin
  if not exists (
    select 1 from public.platform_admins
    where id = auth.uid() and role in ('master', 'finance')
  ) then
    raise exception 'yetkisiz — bu işlem yalnız master/finance platform rolüne açık';
  end if;

  if p_neden is null or trim(p_neden) = '' then
    raise exception 'geri alma nedeni zorunlu';
  end if;

  select * into v_kapanis
  from public.cash_closings
  where id = p_closing_id and reversed_at is null;

  if not found then
    raise exception 'kapanış bulunamadı veya zaten geri alınmış';
  end if;

  -- Kapanışta fark düzeltmesi yapıldıysa, hesabı o düzeltmeden önceki
  -- bakiyeye geri getir.
  if v_kapanis.difference <> 0 then
    perform public.kasa_hareketi_ekle(
      v_kapanis.account_id, -v_kapanis.difference, 'duzeltme',
      'cash_closing_iptal', p_closing_id::text,
      'Kasa kapanışı geri alındı (ByteNova destek): ' || p_neden,
      v_kapanis.tenant_id
    );
  end if;

  update public.cash_closings
  set reversed_at = now(), reversed_by = auth.uid(), reversal_reason = p_neden
  where id = p_closing_id;

  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id, details)
  values (
    auth.uid(), 'kasa_kapanisi_geri_alindi', v_kapanis.tenant_id, 'cash_closing', p_closing_id::text,
    jsonb_build_object(
      'account_id', v_kapanis.account_id, 'closing_date', v_kapanis.closing_date,
      'difference_reverted', v_kapanis.difference, 'reason', p_neden
    )
  );

  -- Tenant'ın kendi audit geçmişine de işlenir — işletme sahibi kasasının
  -- destek tarafından düzeltildiğini görebilmeli, sessizce olmamalı.
  insert into public.audit_logs (tenant_id, user_id, action, entity, entity_id, reason)
  values (
    v_kapanis.tenant_id, auth.uid(), 'kasa_kapanisi_geri_alindi_destek',
    'cash_closing', p_closing_id::text, p_neden
  );
end;
$$;

-- ---------- KONSOL: TENANT DETAYINA KASA KAPANIŞLARI EKLE ----------
-- İmza (parametre tipleri) değişmiyor — yalnız dönen jsonb'nin içeriği
-- genişliyor, bu yüzden düz create-or-replace güvenli (overload riski yok).

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
    ), '[]'::jsonb)
  ) into sonuc
  from public.tenants t
  where t.id = p_tenant_id;

  return sonuc;
end;
$$;
