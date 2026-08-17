-- =============================================================
-- ByteNova — 0044_bildirimler_whatsapp_sms
-- Sprint 9-12, 1/7: WhatsApp/SMS + İYS — sağlayıcı soyutlaması, servis
-- bildirimleri, İYS (İleti Yönetim Sistemi) uyumlu pazarlama onayı.
--
-- Mimari: gerçek bir WhatsApp Business API / SMS ağ geçidi entegrasyonu
-- (gerçek API kimlik bilgileri) bu ortamda mevcut değil. Bu migration ve
-- ilişkili uygulama kodu GERÇEK üretim mimarisini kurar — kuyruk tablosu,
-- tetikleyiciler, işleyici cron — ancak gönderim adımı bilinçli olarak
-- "sandbox" sağlayıcıyla (src/lib/bildirim.ts) simüle edilir. Gerçek bir
-- sağlayıcıya (örn. Twilio/Netgsm WhatsApp Business API) geçiş yalnızca
-- o dosyadaki `SandboxSaglayici`yı gerçek bir HTTP istemcisiyle
-- değiştirmeyi gerektirir — şema/kuyruk/tetikleyici mimarisi değişmez.
-- =============================================================

-- ---------- İYS (pazarlama mesajı onayı) ----------

alter table public.customers
  add column marketing_consent boolean not null default false,
  add column marketing_consent_updated_at timestamptz;

comment on column public.customers.marketing_consent is
  'İYS (İleti Yönetim Sistemi) uyumlu ticari elektronik ileti onayı. Yalnız "pazarlama" tipi şablonlar için zorunlu — servis/operasyonel bildirimler bu onaya tabi değildir.';

-- ---------- BİLDİRİM KUYRUĞU / GEÇMİŞİ ----------

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'sms')),
  template_key text not null,
  template_type text not null check (template_type in ('islemsel', 'pazarlama')),
  message_body text not null,
  status text not null default 'beklemede' check (status in ('beklemede', 'gonderildi', 'basarisiz')),
  reference_type text,
  reference_id text,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notification_log_tenant_idx on public.notification_log (tenant_id, created_at desc);
create index notification_log_beklemede_idx on public.notification_log (status) where status = 'beklemede';

alter table public.notification_log enable row level security;

create policy notification_log_select on public.notification_log
  for select using (tenant_id = public.current_tenant_id());

create policy notification_log_insert on public.notification_log
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner', 'manager', 'cashier', 'technician')
  );

-- ---------- MANUEL / ANLIK BİLDİRİM GÖNDERME ----------
-- Uygulama tarafı (sandbox sağlayıcı) senkron "gönderildi" olarak işaretler.
-- whatsapp_sms eklentisi aktif değilse veya pazarlama şablonunda İYS onayı
-- yoksa işlem reddedilir.

create or replace function public.bildirim_gonder(
  p_customer_id uuid,
  p_channel text,
  p_template_key text,
  p_template_type text,
  p_mesaj text,
  p_referans_tip text default null,
  p_referans_id text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_id uuid;
  v_onay boolean;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if not exists (
    select 1 from public.tenant_addon_subscriptions
    where tenant_id = v_tenant and addon_key = 'whatsapp_sms' and status in ('active', 'trial')
  ) then
    raise exception 'EKLENTI_GEREKLI: WhatsApp/SMS Paketi aktif değil';
  end if;

  if p_channel not in ('whatsapp', 'sms') then
    raise exception 'geçersiz kanal: %', p_channel;
  end if;
  if p_template_type not in ('islemsel', 'pazarlama') then
    raise exception 'geçersiz şablon tipi: %', p_template_type;
  end if;

  if p_template_type = 'pazarlama' then
    select marketing_consent into v_onay from public.customers
    where id = p_customer_id and tenant_id = v_tenant;
    if not coalesce(v_onay, false) then
      raise exception 'IYS_ONAY_GEREKLI: müşteri pazarlama mesajı onayı vermemiş';
    end if;
  end if;

  insert into public.notification_log
    (tenant_id, customer_id, channel, template_key, template_type, message_body,
     status, reference_type, reference_id, created_by, sent_at)
  values
    (v_tenant, p_customer_id, p_channel, p_template_key, p_template_type, p_mesaj,
     'gonderildi', p_referans_tip, p_referans_id, auth.uid(), now())
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------- OTOMATİK TETİKLEYİCİ: SERVİS HAZIR ----------
-- service_orders.status "hazir"a her geçtiğinde kuyruğa "beklemede" bir
-- bildirim eklenir; /api/cron/bildirim-gonder bu kuyruğu işler (gerçek
-- sağlayıcıda olduğu gibi — sandbox'ta anında "gönderildi"ye çevrilir).
-- Müşterinin telefonu yoksa veya whatsapp_sms eklentisi aktif değilse
-- sessizce atlanır (servis akışını asla engellemez).

create or replace function public.servis_hazir_bildirimi_kuyrukla()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_musteri record;
  v_urun_adi text;
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'hazir' then
    if not exists (
      select 1 from public.tenant_addon_subscriptions
      where tenant_id = new.tenant_id and addon_key = 'whatsapp_sms' and status in ('active', 'trial')
    ) then
      return new;
    end if;

    select name, phone into v_musteri from public.customers where id = new.customer_id;
    if v_musteri.phone is null then
      return new;
    end if;

    insert into public.notification_log
      (tenant_id, customer_id, channel, template_key, template_type, message_body,
       status, reference_type, reference_id)
    values (
      new.tenant_id, new.customer_id, 'whatsapp', 'servis_hazir', 'islemsel',
      format('Sayın %s, %s numaralı servis kaydınız hazır — teslim alabilirsiniz.', coalesce(v_musteri.name, ''), new.service_no),
      'beklemede', 'service_order', new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger service_orders_bildirim_kuyrukla
  after update on public.service_orders
  for each row execute function public.servis_hazir_bildirimi_kuyrukla();
