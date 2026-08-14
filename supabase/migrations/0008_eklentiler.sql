-- =============================================================
-- ByteNova — 0008_eklentiler
-- Ücretli eklenti (add-on) kataloğu ve tenant abonelikleri
-- Bkz. docs/EKLENTI_MIMARISI.md
-- =============================================================

-- ---------- KATALOG (platform seviyesi, tüm tenant'lar okuyabilir) ----------

create table public.addon_packages (
  key text primary key,
  name text not null,
  description text not null,
  icon text not null default '🧩',
  monthly_price numeric(10,2),
  currency text not null default 'TRY',
  billing_model text not null default 'flat'
    check (billing_model in ('flat','usage_based','flat_plus_usage')),
  status text not null default 'available'
    check (status in ('draft','available','deprecated')),
  feature_keys text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.addon_packages enable row level security;

-- Katalog herkese (oturum açmış her kullanıcıya) görünür — satış vitrini
create policy "addon_packages_select" on public.addon_packages
  for select to authenticated using (true);

-- ---------- TENANT ABONELİKLERİ ----------

create table public.tenant_addon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  addon_key text not null references public.addon_packages(key),
  status text not null default 'active'
    check (status in ('trial','active','past_due','cancelled')),
  activated_at timestamptz not null default now(),
  activated_by uuid references auth.users(id) on delete set null,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  unique (tenant_id, addon_key)
);

create index tenant_addon_subs_idx on public.tenant_addon_subscriptions (tenant_id, status);

alter table public.tenant_addon_subscriptions enable row level security;

create policy "addon_subs_select" on public.tenant_addon_subscriptions
  for select using (tenant_id = public.current_tenant_id());

create policy "addon_subs_insert" on public.tenant_addon_subscriptions
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

create policy "addon_subs_update" on public.tenant_addon_subscriptions
  for update using (
    tenant_id = public.current_tenant_id()
    and public.rol_su() in ('owner','manager')
  );

-- ---------- KULLANIM SAYAÇLARI (usage-based paketler için) ----------

create table public.addon_usage_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  addon_key text not null,
  event_type text not null,
  quantity int not null default 1,
  occurred_at timestamptz not null default now()
);

create index addon_usage_idx on public.addon_usage_events (tenant_id, addon_key, occurred_at);

alter table public.addon_usage_events enable row level security;

create policy "addon_usage_select" on public.addon_usage_events
  for select using (tenant_id = public.current_tenant_id());

create policy "addon_usage_insert" on public.addon_usage_events
  for insert with check (tenant_id = public.current_tenant_id());

-- ---------- LANSMAN KATALOĞU (docs/EKLENTI_MIMARISI.md Bölüm 4) ----------
-- Fiyatlar başlangıç önerisidir; Konsol'da düzenlenebilir hale gelene kadar SQL ile güncellenir.

insert into public.addon_packages
  (key, name, description, icon, monthly_price, billing_model, feature_keys, sort_order)
values
  ('whatsapp_sms', 'WhatsApp & SMS Paketi',
   'WhatsApp Business API, SMS gönderimi, İYS uyumlu kampanya yönetimi ve otomatik servis bildirimleri.',
   '📱', 299, 'usage_based', array['bildirimler'], 1),
  ('e_belge', 'e-Belge Paketi',
   'e-Fatura, e-Arşiv ve e-İrsaliye entegratör bağlantısı; gider pusulası otomasyonu.',
   '🧾', 349, 'flat_plus_usage', array['belgeler'], 2),
  ('crm_plus', 'CRM Plus',
   'Müşteri segmentasyonu, toplu kampanya mesajı, sadakat/puan sistemi, doğum günü hatırlatmaları ve müşteri analitik panosu.',
   '👥', 249, 'flat', array[]::text[], 3),
  ('stok_plus', 'Stok Plus',
   'Çoklu depo/lokasyon, toptancı XML/B2B fiyat entegrasyonu, gelişmiş sayım otomasyonu ve parça uyumluluk matrisi.',
   '📦', 299, 'flat', array[]::text[], 4),
  ('finans_plus', 'Finans Plus',
   'Çek/senet portföyü, POS mutabakat otomasyonu, dövizli cari ve nakit akış projeksiyon raporu.',
   '💰', 249, 'flat', array[]::text[], 5),
  ('kurumsal_satis', 'Kurumsal Satış Paketi',
   'Teklif yönetimi (PDF+QR onay), periyodik bakım sözleşmeleri, SLA takibi ve toplu iş emri.',
   '📄', 349, 'flat', array['teklifler','sozlesmeler'], 6),
  ('pc_toplama', 'PC Toplama Paketi',
   'Reçete (BOM), toplama emri ve demontaj/parça hasadı yönetimi.',
   '🖥️', 199, 'flat', array['pc-toplama'], 7),
  ('pazaryeri', 'Pazaryeri Paketi',
   'Trendyol, Hepsiburada ve N11 ile stok/sipariş senkronizasyonu.',
   '🛒', 299, 'flat_plus_usage', array['pazaryeri'], 8)
on conflict (key) do nothing;
