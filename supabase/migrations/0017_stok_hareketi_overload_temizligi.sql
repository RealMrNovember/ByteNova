-- =============================================================
-- ByteNova — 0017_stok_hareketi_overload_temizligi
-- 0016'da stok_hareketi_ekle()'ye p_negatif_onay parametresi eklenirken
-- "create or replace function" imza (parametre listesi) değiştiği için
-- fonksiyonun YERİNE geçmedi, YANINA ikinci bir overload olarak eklendi.
-- İki overload aynı anda var olunca varsayılan parametrelerle çağrılan
-- her istek "is not unique" hatasıyla belirsiz kalıyordu (sayim_tamamla
-- içindeki `perform stok_hareketi_ekle(...)` çağrısı canlı testte patladı).
-- Eski 6 parametreli sürüm burada açıkça düşürülüyor.
-- =============================================================

drop function if exists public.stok_hareketi_ekle(uuid, numeric, text, text, text, text);
