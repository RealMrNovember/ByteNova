-- =============================================================
-- ByteNova — 0037_performans_tenant_index
-- Sprint 6, Gün 30 (2/3): Performans geçişi. Introspection ile `tenant_id`
-- sütunu olup da onu kapsayan hiçbir index'i bulunmayan 14 tablo bulundu.
-- Bu tabloların çoğu zaten doğal bir üst-kayıt (sale_id, customer_id vb.)
-- index'ine sahip ve gerçek sorgu kalıpları o üzerinden çalışıyor — ama
-- her RLS SELECT'i ayrıca `tenant_id = current_tenant_id()` filtresi
-- uyguluyor ve tenant_id'siz bir index bu filtreyi index-only karşılayamaz.
-- Düşük maliyetli, ileriye dönük bir önlem olarak tenant_id index'i
-- ekleniyor (tablolar bugün küçük, ama büyüdükçe RLS filtresi sequential
-- scan'e düşmesin diye).
-- =============================================================

create index customer_events_tenant_idx on public.customer_events (tenant_id);
create index customer_ledger_tenant_idx on public.customer_ledger (tenant_id);
create index device_events_tenant_idx on public.device_events (tenant_id);
create index feature_notify_requests_tenant_idx on public.feature_notify_requests (tenant_id);
create index invitations_tenant_idx on public.invitations (tenant_id);
create index purchase_items_tenant_idx on public.purchase_items (tenant_id);
create index sale_items_tenant_idx on public.sale_items (tenant_id);
create index sale_payments_tenant_idx on public.sale_payments (tenant_id);
create index service_notes_tenant_idx on public.service_notes (tenant_id);
create index service_parts_tenant_idx on public.service_parts (tenant_id);
create index service_photos_tenant_idx on public.service_photos (tenant_id);
create index service_status_history_tenant_idx on public.service_status_history (tenant_id);
create index stock_count_items_tenant_idx on public.stock_count_items (tenant_id);
create index supplier_ledger_tenant_idx on public.supplier_ledger (tenant_id);
