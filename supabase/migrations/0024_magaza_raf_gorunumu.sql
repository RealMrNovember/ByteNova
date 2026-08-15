-- =============================================================
-- ByteNova — 0024_magaza_raf_gorunumu
-- Mağaza ayrı bir modül değil — Stok'un içinde bir görünüm. Aynı ürün
-- kaydı hem envanteri hem "rafta mı sergileniyor" bilgisini taşır; bu
-- sayede tekil veri kaynağı korunur (ayrı bir Mağaza tablosu, aynı
-- ürünün iki yerde senkron dışı kalma riskini doğururdu).
-- =============================================================

alter table public.products
  add column is_shelf_display boolean not null default false;

create index products_shelf_display_idx on public.products (tenant_id, is_shelf_display) where is_shelf_display;
