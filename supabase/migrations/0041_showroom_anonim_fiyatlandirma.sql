-- Showroom fiyatlandırma sayfası oturumsuz (anonim) ziyaretçilere gerçek
-- abonelik planı ve eklenti fiyatlarını göstermeli. subscription_plans ve
-- addon_packages tabloları yalnızca "authenticated" rolüne açıktı — anon
-- rolü için, yalnız aktif/satıştaki satırları gösteren ayrı bir SELECT
-- politikası ekliyoruz. Her iki tabloda da hassas/iç veri yok (yalnızca
-- pazarlama amaçlı ad/fiyat/özellik listesi).

create policy subscription_plans_anon_select
  on public.subscription_plans for select
  to anon
  using (is_active = true);

create policy addon_packages_anon_select
  on public.addon_packages for select
  to anon
  using (status = 'available');
