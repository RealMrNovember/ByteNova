-- =============================================================
-- ByteNova — 0036_sertlestirme_rls_taramasi
-- Sprint 6, Gün 30 (1/3): RLS güvenlik taraması sonucu bulunan gerçek
-- açık — düzeltme.
--
-- `pg_tables`/`pg_policies` introspection'ı ile tüm public tabloları
-- tarandı: dört sayaç tablosunda (sale_no_counters, service_no_counters,
-- return_no_counters, purchase_no_counters — belge numarası üretiminde
-- kullanılan `sonraki_*_no()` SECURITY DEFINER fonksiyonlarının arkasında)
-- RLS TAMAMEN KAPALIYDI. Bu, herhangi bir giriş yapmış kullanıcının
-- PostgREST üzerinden bu tablolara DOĞRUDAN erişip (a) başka tenant'ların
-- sayaçlarını görebilmesine (bilgi sızıntısı) ve (b) `last_no` değerini
-- doğrudan UPDATE ederek başka bir tenant'ın belge numarası sayacını
-- geriye alıp ÇAKIŞAN belge numaraları üretmesine (SN-2026-000005'in iki
-- kez üretilmesi gibi) yol açabilirdi — sayaç fonksiyonları bu tabloyu
-- SECURITY DEFINER ile yazdığı için RLS onları etkilemez, yalnızca
-- doğrudan istemci erişimini kapatmak yeterli.
-- =============================================================

alter table public.sale_no_counters enable row level security;
alter table public.service_no_counters enable row level security;
alter table public.return_no_counters enable row level security;
alter table public.purchase_no_counters enable row level security;

create policy "sale_no_counters_select" on public.sale_no_counters
  for select using (tenant_id = public.current_tenant_id());

create policy "service_no_counters_select" on public.service_no_counters
  for select using (tenant_id = public.current_tenant_id());

create policy "return_no_counters_select" on public.return_no_counters
  for select using (tenant_id = public.current_tenant_id());

create policy "purchase_no_counters_select" on public.purchase_no_counters
  for select using (tenant_id = public.current_tenant_id());

-- Bilerek INSERT/UPDATE/DELETE politikası eklenmedi — sayaçlar yalnızca
-- sonraki_*_no() SECURITY DEFINER fonksiyonları üzerinden değişir, hiçbir
-- istemci bu tabloya doğrudan yazamamalı.
