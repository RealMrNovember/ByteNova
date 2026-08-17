-- =============================================================
-- ByteNova — 0032_konsol_mfa_ayri_kimlik
-- Sprint 6, Gün 28: Konsol için MFA zorunluluğu + ayrı kimlik alanı.
--
-- MFA'nın kendisi (TOTP faktörleri, AAL) Supabase Auth'un yerleşik
-- `auth.mfa_factors`/`auth.sessions` altyapısı üzerinden yürüyor — yeni
-- bir tablo gerekmiyor, uygulama tarafında (konsol layout) her istekte
-- AAL2 zorunluluğu kontrol ediliyor.
--
-- "Ayrı kimlik alanı": Konsol artık tenant panelinden tamamen farklı bir
-- çerez adı (sb-konsol) kullanan ayrı bir Supabase istemcisiyle çalışıyor
-- — aynı tarayıcıda tenant paneli oturumu ile konsol oturumu birbirinden
-- habersiz, biri diğerini etkilemiyor/sonlandırmıyor. Bilinçli kapsam:
-- TAM anlamda "iki ayrı kimlik havuzu" (ayrı bir Supabase Auth projesi)
-- burada kurulmadı — bu, yeni bir Supabase projesi + yeni ortam
-- değişkenleri + DNS gerektiren bir altyapı kararı olduğu için tek
-- taraflı yapılmadı. Bugünkü çözüm (ayrı çerez alanı + zorunlu MFA +
-- opsiyonel IP kısıtı) günlük kullanımda gerçek izolasyonu sağlıyor.
-- =============================================================

alter table public.platform_admins
  add column allowed_ips text[];

comment on column public.platform_admins.allowed_ips is
  'Doluysa, bu admin yalnız listedeki IP''lerden konsola girebilir (opsiyonel).';
