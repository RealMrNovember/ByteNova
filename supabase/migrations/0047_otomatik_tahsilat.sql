-- =============================================================
-- ByteNova — 0047_otomatik_tahsilat
-- Sprint 9-12, 4/7: Otomatik abonelik tahsilatı (BillingProvider) +
-- dunning + destek görünümü (impersonation'ın salt-okunur karşılığı).
--
-- Kapsam kararları:
-- 1) BillingProvider soyutlaması gerçek mimariyle kuruluyor (kayıtlı
--    ödeme yöntemi, tahsilat denemesi kaydı, otomatik yeniden deneme /
--    dunning zinciri) ancak gerçek bir iyzico/PayTR kimlik bilgisi bu
--    ortamda yok — src/lib/billing.ts'teki SandboxSaglayici hiçbir
--    gerçek kart verisini işlemez, yalnızca test senaryolarını simüle
--    eder. Kart numarası ASLA ByteNova sunucusuna girilmez/saklanmaz —
--    gerçek entegrasyonda bu adım sağlayıcının barındırdığı ödeme
--    sayfasına yönlendirmedir; sandbox'ta bu yönlendirme simüle edilir
--    ve yalnızca sağlayıcının geri döneceği token/son4hane saklanır.
-- 2) "impersonation" gerçek bir oturum ele geçirme (tenant kullanıcısı
--    gibi yazma yetkisi kazanma) OLARAK KURULMADI — bilinçli güvenlik
--    kararı. Bunun yerine "destek görünümü": salt-okunur, dar kapsamlı,
--    her erişimde tenant_events'e (işletme sahibi de görebilir) ve
--    platform_audit_logs'a yazılan bir görünüm. Konsol zaten yalnızca
--    sayaç gösteriyordu (admin_tenant_detay) — bu, destek rolüne YENİ
--    ve kasıtlı olarak sınırlı bir görünürlük ekliyor.
-- =============================================================

alter table public.tenant_events drop constraint tenant_events_event_type_check;
alter table public.tenant_events add constraint tenant_events_event_type_check
  check (event_type in (
    'plan_degisti', 'askiya_alindi', 'yeniden_etkinlestirildi', 'uzatildi',
    'dekont_yuklendi', 'dekont_onaylandi', 'dekont_reddedildi', 'kapatildi',
    'deneme_bitti', 'odeme_yontemi_eklendi', 'odeme_yontemi_kaldirildi',
    'otomatik_tahsilat_basarili', 'otomatik_tahsilat_basarisiz', 'destek_goruntuledi'
  ));

-- ---------- KAYITLI ÖDEME YÖNTEMİ (yalnız token/son4hane — asla PAN) ----------

create table public.tenant_payment_methods (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  provider text not null default 'sandbox' check (provider in ('sandbox')),
  provider_token text not null,
  brand text,
  last4 text,
  expiry_month int,
  expiry_year int,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tenant_payment_methods enable row level security;

create policy tenant_payment_methods_select on public.tenant_payment_methods
  for select using (tenant_id = public.current_tenant_id());

-- ---------- TAHSİLAT GEÇMİŞİ ----------

create table public.subscription_charges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'TRY',
  status text not null check (status in ('basarili', 'basarisiz')),
  provider_reference text,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index subscription_charges_tenant_idx on public.subscription_charges (tenant_id, created_at desc);

alter table public.subscription_charges enable row level security;

create policy subscription_charges_select on public.subscription_charges
  for select using (tenant_id = public.current_tenant_id());

-- ---------- ÖDEME YÖNTEMİ KAYDET / KALDIR (tenant kendi başına) ----------

create or replace function public.odeme_yontemi_kaydet(
  p_provider_token text,
  p_brand text,
  p_last4 text,
  p_expiry_month int,
  p_expiry_year int
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  insert into public.tenant_payment_methods
    (tenant_id, provider_token, brand, last4, expiry_month, expiry_year, created_by)
  values
    (v_tenant, p_provider_token, p_brand, p_last4, p_expiry_month, p_expiry_year, auth.uid())
  on conflict (tenant_id) do update
    set provider_token = excluded.provider_token, brand = excluded.brand, last4 = excluded.last4,
        expiry_month = excluded.expiry_month, expiry_year = excluded.expiry_year,
        created_by = excluded.created_by, created_at = now();

  insert into public.tenant_events (tenant_id, admin_id, event_type, description)
  values (v_tenant, null, 'odeme_yontemi_eklendi', format('Otomatik ödeme için kart eklendi (**** %s)', p_last4));
end;
$$;

create or replace function public.odeme_yontemi_kaldir()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  delete from public.tenant_payment_methods where tenant_id = v_tenant;

  insert into public.tenant_events (tenant_id, admin_id, event_type, description)
  values (v_tenant, null, 'odeme_yontemi_kaldirildi', 'Otomatik ödeme yöntemi kaldırıldı');
end;
$$;

-- ---------- TAHSİLAT SONUCUNU KAYDET (yalnız sistem/platform admin) ----------
-- Gerçek "tahsilatı deneme" adımı uygulama katmanında (cron route,
-- BillingProvider) olur — burası yalnızca sonucu güvenilir şekilde
-- kaydeder ve başarılıysa aboneliği uzatır. auth.uid() dolu ama
-- platform admin değilse (yani sıradan bir tenant kullanıcısı bu RPC'yi
-- doğrudan çağırmaya çalışıyorsa) reddedilir — keyfi tenant_id ile
-- başka birinin aboneliğini "başarılı" işaretleyemez.

create or replace function public.abonelik_tahsilat_kaydet(
  p_tenant_id uuid,
  p_basarili boolean,
  p_tutar numeric,
  p_provider_referans text default null,
  p_hata_mesaji text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_donem_gun int;
begin
  if auth.uid() is not null and not public.is_platform_admin() then
    raise exception 'yalnızca sistem tarafından çağrılabilir';
  end if;

  insert into public.subscription_charges (tenant_id, amount, status, provider_reference, failure_reason)
  values (p_tenant_id, p_tutar, case when p_basarili then 'basarili' else 'basarisiz' end,
          p_provider_referans, p_hata_mesaji);

  if p_basarili then
    select case when billing_cycle = 'yillik' then 365 else 30 end into v_donem_gun
    from public.tenants where id = p_tenant_id;

    update public.tenants
    set status = 'active', trial_ends_at = greatest(trial_ends_at, now()) + (coalesce(v_donem_gun, 30) || ' days')::interval
    where id = p_tenant_id;

    insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
    values (p_tenant_id, null, 'otomatik_tahsilat_basarili',
      format('Otomatik tahsilat başarılı: %s TL', p_tutar), jsonb_build_object('referans', p_provider_referans));
  else
    insert into public.tenant_events (tenant_id, admin_id, event_type, description, details)
    values (p_tenant_id, null, 'otomatik_tahsilat_basarisiz',
      format('Otomatik tahsilat başarısız: %s', coalesce(p_hata_mesaji, 'bilinmeyen hata')),
      jsonb_build_object('tutar', p_tutar));
  end if;
end;
$$;

-- ---------- DESTEK GÖRÜNÜMÜ (salt okunur, dar kapsamlı, denetimli) ----------

create or replace function public.admin_destek_gorunumu(p_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_rol text;
  v_sonuc jsonb;
begin
  select role into v_rol from public.platform_admins where id = auth.uid();
  if v_rol is null or v_rol not in ('master', 'manager', 'support') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select jsonb_build_object(
    'son_satislar', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'sale_no', s.sale_no, 'total_amount', s.total_amount, 'created_at', s.created_at,
        'musteri_adi', c.name
      ) order by s.created_at desc), '[]'::jsonb)
      from (select * from public.sales where tenant_id = p_tenant_id order by created_at desc limit 10) s
      left join public.customers c on c.id = s.customer_id
    ),
    'son_servisler', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'service_no', so.service_no, 'status', so.status, 'created_at', so.created_at,
        'musteri_adi', c.name
      ) order by so.created_at desc), '[]'::jsonb)
      from (select * from public.service_orders where tenant_id = p_tenant_id order by created_at desc limit 10) so
      left join public.customers c on c.id = so.customer_id
    ),
    'son_musteriler', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', name, 'phone', phone, 'created_at', created_at
      ) order by created_at desc), '[]'::jsonb)
      from (select * from public.customers where tenant_id = p_tenant_id order by created_at desc limit 5) x
    )
  ) into v_sonuc;

  insert into public.tenant_events (tenant_id, admin_id, event_type, description)
  values (p_tenant_id, auth.uid(), 'destek_goruntuledi', 'Destek ekibi salt-okunur görünümle inceledi');

  -- audit_ekle() burada kullanılamaz: current_tenant_id() auth.uid()'yi
  -- profiles'a bakarak çözer, ama çağıran bir platform_admins kaydı —
  -- tenant_id NULL döner ve audit_logs.tenant_id NOT NULL'a çarpıp TÜM
  -- işlemi (yukarıdaki tenant_events satırı dahil) geri alırdı — Teklif
  -- modülünde (0040) aynı sınıf hatanın canlı testte yakalanmış hali.
  insert into public.platform_audit_logs (admin_id, action, target_tenant_id, entity, entity_id)
  values (auth.uid(), 'destek_gorunumu_erisildi', p_tenant_id, 'tenant', p_tenant_id::text);

  return v_sonuc;
end;
$$;
