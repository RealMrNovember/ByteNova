# BYTENOVA — GÜN GÜN İNŞA PLANI

**Referans doküman:** [ByteNova_PROJE_DOSYASI_v2.md](ByteNova_PROJE_DOSYASI_v2.md)
**Yaklaşım:** *Ship-first* — proje 1. günden canlıda çalışır; her gün bir eksik kapatılır, her gün sonu deploy edilir.
**Son güncelleme:** 14 Ağustos 2026

## Altyapı

| Bileşen | Karar |
|---|---|
| Hosting / CI-CD | Vercel (proje: `byte-nova`) — `main` push → otomatik production deploy |
| Veritabanı / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| DNS | Cloudflare — `bytenova.cicibyte.com` → Vercel |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Masaüstü (ileri sprint) | Tauri — lokal SQLite replika + donanım köprüsü |

## Çalışma Ritmi

1. **Her gün sonunda `main`'e push → canlı deploy.** Yarım özellik feature flag arkasında gizlenir, deploy asla bekletilmez.
2. Gün tamamlanınca bu dosyada işaretlenir; önemli değişiklikler `CHANGELOG.md`'ye düşülür.
3. Şema değişiklikleri yalnız migration ile (`supabase/migrations`); panelden elle şema değişikliği yasak.
4. Tenant izolasyonu (RLS) 2. günden itibaren her tabloda; sonradan eklenmez.
5. Vergi/mevzuat değerleri koda gömülmez; kural tablolarından okunur.
6. Her modül "UI → Service → Domain Rule → DB → Audit → Event" zinciriyle yazılır (proje dosyası Bölüm 52).

---

## SPRINT 0 — CANLIYA ÇIK (Gün 1-2)

### ✅ Gün 1 — İskelet + markalı Showroom canlıda
- [x] Next.js + TypeScript + Tailwind iskeleti (repo kökü)
- [x] Koyu tema tasarım temelleri (ByteNova renk paleti, tipografi)
- [x] Showroom v0: hero, slogan, özellik vitrini, Giriş/Kayıt butonları
- [x] `/giris`, `/kayit`, `/panel` route iskeletleri
- [x] Vercel deploy zinciri (GitHub push → production)
- [x] Cloudflare DNS: `bytenova.cicibyte.com` → Vercel (doğrulandı, canlı)

### Gün 2 — Supabase + Auth
- [x] Supabase env bağlantısı (lokal `.env.local`)
- [x] Vercel env değişkenleri
- [x] İlk migration: `tenants`, `profiles`, `audit_logs`, `feature_flags` (`0001_init.sql` — uygulandı)
- [x] RLS politikaları + yeni kayıt tetikleyicisi (tenant + owner profili otomatik)
- [x] Kayıt → e-posta doğrulama → tenant oluşturma → panele düşme; giriş/çıkış/parola sıfırlama
- [x] Korumalı `/panel` (middleware: oturumsuz erişim → `/giris`, oturumluyken `/giris` → `/panel`)

### Gün 2+ — Onboarding, Google, WhatsApp (kullanıcı talebi ile öne alındı)
- [x] Google ile giriş/kayıt (Supabase provider yapılandırıldı) — *consent screen "Testing" modunda: yayınlanana dek yalnız test kullanıcıları*
- [x] Şirket bilgileri kurulum ekranı `/kurulum` (ad, telefon, adres, logo yükleme) + panel yönlendirmesi
- [x] `0002_sirket_profili.sql` uygulandı (tenant alanları + logo storage) — E2E testten geçti
- [x] WhatsApp destek hattı butonu (tüm sayfalarda, +90 535 489 50 50)
- [x] Showroom oturum-duyarlı başlık (girişliyse "Panele Git")
- [ ] Özel SMTP (dahili e-posta servisi saatte ~2-3 ile sınırlı — üretim öncesi şart)

**Sprint sonu:** Kayıt olan kullanıcı kendi tenant'ıyla panele giriyor; site `bytenova.cicibyte.com`'da yayında.

---

## SPRINT 1 — PANEL İSKELETİ (Gün 3-5)

### Gün 3 — Tasarım sistemi + panel yerleşimi ✅
- [x] Panel layout: daraltılabilir sol menü (tercih hatırlanır) + üst bar (arama placeholder, kur göstergesi, deneme rozeti, bildirim, profil menüsü + çıkış)
- [x] Mobil: alt sekme çubuğu (Genel/Servisler/Satış/Menü) + tüm modüller ekranı
- [x] **Tam menü ağacı** tek kaynaktan (`src/lib/menu.ts` registry) — 17 modül, İnşada/Yakında rozetli
- [x] "Çok Yakında" tanıtım ekranları (modül başına açıklama, catch-all route)
- [x] E2E doğrulandı: giriş → panel kabuğu → yakında ekranı
- [ ] Çekirdek bileşen kitaplığının ayrıştırılması (Modal, Toast, Table — ihtiyaç oldukça)

### Gün 4 — Feature flag + komut paleti ✅
- [x] Feature flag DB'ye bağlandı (`efektifMenu`: tenant override > global > kod varsayılanı)
- [x] "Hazır olunca haber ver" kaydı (`0003_feature_notify.sql` + RLS, E2E doğrulandı)
- [x] `Ctrl+K` komut paleti v1 (modül arama + klavye navigasyonu; müşteri/servis araması Sprint 2'de eklenecek)

### Gün 5 — Tenant kurulumu + roller ✅
- [x] Roller ve yetki matrisi (`src/lib/yetki.ts`): 6 rol, eylem bazlı yetkiler
- [x] Şubeler tablosu + her tenant'a otomatik "Merkez" şubesi (`0004_roller_davet.sql`)
- [x] **Kullanıcı daveti:** link tabanlı davet akışı (7 gün geçerli), `/davet/[token]` kabul sayfası, davetlinin boş tenant'ının otomatik temizlenmesi
- [x] **Ayarlar sayfası aktif:** işletme bilgileri, kullanıcı listesi, rol değiştirme (yalnız sahip), davet yönetimi
- [x] Audit servisi (`audit_ekle` fonksiyonu): işletme güncelleme, rol değişimi, davet olayları kayıt altında
- [x] E2E: davet → kabul → tenant taşınma → rol değişimi + izinsiz erişim negatif testleri geçti
- [x] Resend SMTP geçişi tamamlandı (`no-reply@cicibyte.com` — saatlik e-posta limiti sorunu çözüldü)

**Sprint sonu:** ✅ Panel, ürünün tüm vizyonunu menüde gösteriyor; rol sistemi, davet ve audit çalışıyor.

---

## SPRINT 2 — İLK GERÇEK DEĞER: MÜŞTERİ + SERVİS (Gün 6-10)

### Gün 6 — Müşteri ✅
- [x] Müşteri CRUD (bireysel/kurumsal, vergi alanları, çoklu telefon, notlar) + `0005_musteriler.sql`
- [x] Liste + ad/telefon/e-posta araması; hard delete yok (pasifleştirme)
- [x] Müşteri 360° iskeleti (özet şerit; servis/satış/cihaz modülleri geldikçe dolacak) + WhatsApp hızlı erişim
- [x] İletişim geçmişi (not/arama/WhatsApp/SMS/e-posta kayıtları)
- [x] E2E: CRUD + arama + olay + **tenant izolasyonu negatif testleri** geçti
- [x] Menüde Müşteriler AKTİF

### Gün 7 — Cihaz ✅
- [x] Cihaz varlığı: tür (8 kategori), marka/model, seri no (tenant içi benzersiz — DB kısıtı), IMEI/MAC
- [x] `0006_cihazlar.sql`: devices + device_events, RLS, seri no unique index (uygulandı)
- [x] Cihaz-müşteri ilişkisi (arama kutulu seçici) + cihaz zaman çizelgesi (created/ownership olayları)
- [x] Müşteri 360°'a cihaz listesi bağlandı (gerçek sayı + "Cihaz Ekle" kısayolu)
- [x] **Ctrl+K paleti artık gerçek arama:** müşteri (ad/telefon) + cihaz (seri no/IMEI/marka/model), 250ms debounce
- [x] E2E: CRUD + mükerrer seri no reddi (409) + arama + sahiplik ilişkisi geçti
- [x] Menüde Cihazlar AKTİF

### Gün 8 — Servis kabul ✅
- [x] Kabul akışı: müşteri seç/oluştur → cihaz seç/oluştur (akıştan çıkmadan) → beyan → dinamik checklist (cihaz türüne göre) → aksesuar chip'leri → öncelik → beyan metni onayı
- [x] Servis no üretimi (`BN-YYYY-NNNNNN`, tenant+yıl bazlı sayaç) + durum makinesi altyapısı (`0007_servisler.sql`, uygulandı)
- [x] Servis listesi (arama: servis no) + minimal detay sayfası (durum geçmişi zaman çizelgesi, checklist/aksesuar/onay gösterimi)
- [x] E2E: servis no formatı/sayaç, otomatik durum geçmişi tetikleyicisi, mükerrer no reddi (409), tenant izolasyonu — hepsi API seviyesinde doğrulandı
- [x] **Tam UI akışı gerçek tarayıcıda uçtan uca test edildi** (S1 senaryosunun kabul kısmı): müşteri seç → cihaz oluştur/seç → checklist işaretle → aksesuar ekle → öncelik seç → onay → `BN-2026-000001` başarıyla oluştu

### Gün 9 — Servis operasyonu ✅
- [x] Servis listesi + detay ekranı + durum geçmişi (Gün 8'de temeli atıldı)
- [x] `0009_servis_notlari.sql`: teknik notlar (müşteri beyanından ayrı, ekip-içi) — uygulandı
- [x] `ServisIslemleri`: durum değiştirme (18 durumun tamamı) + teknisyen atama, ikisi de audit'li
- [x] Servis listesi: "Tümü / Bana Atananlar" filtresi + öncelik filtresi + teknisyen sütunu
- [x] Servis detayında teknisyen rozeti (🔧 Ad Soyad) başlık kartında görünür
- [x] E2E (tarayıcı): durum değişikliği → geçmişe otomatik yazıldı, teknisyen atandı → listede/detay'da göründü, teknik not eklendi → DB'de doğrulandı, öncelik filtresi doğru boş/dolu sonuç verdi
- [x] Ufak düzeltme: `consent_accepted_at` null iken epoch tarihi (1970) gösterme hatası giderildi

### Gün 10 — Servis çıktıları ✅
- [x] `0011_servis_ciktilari.sql`: `service_photos` tablosu, `delivery_note` alanı, özel (private) `servis-belgeleri` bucket'ı — imzalı URL ile erişim (uygulandı)
- [x] Cihaz fotoğrafı yükleme (çoklu, galeri görünümü, imzalı URL'lerle)
- [x] **PDF motoru** (`@react-pdf/renderer` + `qrcode`): Servis Kabul Formu + Teslim Tutanağı, QR kodlu, işletme/müşteri/cihaz/checklist/aksesuar/beyan içerikli — `/api/servis/[id]/pdf` route'undan indirilebilir
- [x] Teslim akışı: aksesuar teslim kontrolü (checkbox) + teslim notu + "Teslimi Tamamla" → durum + `delivered_at` + aksesuar durumları tek işlemde güncelleniyor
- [x] **Eklenti-korumalı WhatsApp gönderimi:** PDF indirme her zaman ücretsiz/serbest; "WhatsApp'tan Gönder" yalnızca `whatsapp_sms` eklentisi aktifse görünür — pasifken Eklentiler'e yönlendiren kilit rozeti
- [x] WhatsApp akışı: PDF → özel bucket'a yükle → 7 gün geçerli imzalı URL → `wa.me` derin bağlantısı (müşteri telefonu önceden dolu)
- [x] Menüde Servisler **AKTİF** — tam döngü (kabul→durum→teknisyen→teslim→PDF) tamamlandı
- [x] E2E (tarayıcı): fotoğraf bölümü, PDF indirme (gerçek `%PDF-` başlıklı, 200 OK), teslim akışı (durum→Teslim Edildi, aksesuarlar✓, Teslim Tutanağı linki belirdi), eklenti aktifken WhatsApp butonları belirdi, storage+audit doğrulandı
- [x] **Canlı testte bulunup düzeltilen hata:** WhatsApp gönderiminde `window.open` async işlem sonrası çağrıldığından pop-up engelleyiciye takılabiliyordu — pencere artık tıklamayla senkron açılıp sonra yönlendiriliyor

**Sprint sonu:** 🎯 **Dükkânda kullanılabilir ilk sürüm** — S1 senaryosunun servis tarafı (kabul→teşhis→onarım→teslim→belge) uçtan uca dönüyor.

### Ek — Hızlı müşteri kaydı UX düzeltmesi ✅ (kullanıcı geri bildirimiyle)
Servis/Cihaz oluşturma formunda müşteri bulunamadığında tam sayfa `/panel/musteriler/yeni`'ye yönlendirme, akışı bölüyordu (müşteri tezgahta beklerken dakikalarca kayıp). `MusteriSec` (paylaşılan bileşen — hem Servis hem Cihaz formunda kullanılıyor) artık `CihazSecVeyaOlustur` ile aynı deseni izliyor:
- Arama kutusunun yanında her zaman görünen **"+ Yeni"** butonu — aramayı beklemeden direkt hızlı kayda geçilebilir
- Aranan metin otomatik ayrıştırılıyor (rakam ağırlıklıysa telefon, değilse ad alanına ön dolduruluyor)
- Yalnız **Ad Soyad + Telefon** (zorunlu minimum) — adres/vergi/notlar sonra müşteri kartından eklenir
- Kayıt sayfa değişmeden oluşuyor ve anında seçili hale geliyor, form kaldığı yerden (Cihaz adımına) devam ediyor
- Audit'e `kaynak: hizli_kayit` ile düşüyor
- E2E: telefon ön-doldurma, sayfa değişmeden kayıt+seçim, DB/audit doğrulaması, Cihaz formunda da aynı bileşenin çalıştığı doğrulandı

---

## SPRINT 3 — ÜRÜN, STOK, DÖVİZ (Gün 11-15)

### Gün 11 — Ürün ✅
- [x] `0012_urunler.sql`: `products` + `product_categories`, barkod tenant içinde benzersiz, RLS — uygulandı
- [x] Ürün kartı: SKU, barkod, marka, kategori, birim, alış/satış fiyatı (TL — Gün 12'de döviz eklenecek), KDV, min/kritik stok, seri no zorunluluğu, garanti (ay)
- [x] `KategoriSec`: dropdown + akıştan çıkmadan hızlı kategori ekleme (Gün 10'daki `MusteriSec` deseniyle tutarlı)
- [x] Liste: arama (ad/SKU/barkod) + kritik stok filtresi; detay: kâr marjı otomatik hesaplanıyor
- [x] Ctrl+K paletine ürün araması eklendi (ad/SKU/barkod)
- [x] Menüde Stok → İnşada (tam döngü Gün 13/15'te tamamlanınca Aktif olacak)
- [x] E2E: hızlı kategori oluşturma, ürün kaydı, mükerrer barkod reddi (409), kritik stok filtresi, Ctrl+K araması — tarayıcıda ve DB'de doğrulandı

### Gün 12 — Döviz çekirdeği ✅
- [x] `0013_doviz.sql`: `currencies` (TRY/USD/EUR/GBP — tek dövize kilitli değil, genişletilebilir), `exchange_rates` (tenant_id null=global TCMB, dolu=dükkân override), RLS — uygulandı
- [x] TCMB günlük kur çekme: `/api/cron/kur-guncelle` (fast-xml-parser ile gerçek TCMB XML'i ayrıştırıyor, ForexSelling kuru kullanılıyor) + `vercel.json` cron (her gün 13:00 UTC) + `CRON_SECRET` korumalı
- [x] Lokalde gerçek TCMB verisiyle test edildi ve seed edildi: USD 47,81 · EUR 55,24 · GBP 64,75
- [x] Ayarlar → Döviz Kurları: her para birimi için TCMB kuru + manuel "dükkân kuru" override (owner/manager), anlık kaydet/TCMB'ye dön
- [x] Ürün formu: dövizli alış fiyatı (para birimi seçici) + canlı TL karşılığı önizlemesi + "satış fiyatını otomatik hesapla" (maliyet × kur × marj, yukarı yuvarlanmış)
- [x] Ürün detayında kâr marjı artık dövizli alışı güncel kurla TL'ye çevirip hesaplıyor (canlı testte bulunan bir hesaplama hatası düzeltildi)
- [x] Üst barda canlı kur göstergesi (USD/EUR/GBP), tıklanınca Ayarlar'a gidiyor
- [x] **Header düzeni düzeltmesi** (kullanıcı geri bildirimi): sol/orta/sağ üç bölgeli yerleşim, arama artık `position:absolute` ile header'a göre matematiksel olarak tam ortada (sol/sağ içerik genişliğinden bağımsız), profil grubu tam sağa yaslı — ölçümle doğrulandı (merkez farkı 0px)
- [x] E2E: gerçek TCMB verisiyle header, manuel override (yalnız ilgili para birimini değiştirdiği doğrulandı), dövizli ürün formu (50 USD × 48,5 TL × %25 marj = 3032 TL), ürün detayında dövizli gösterim ve kâr marjı — tarayıcıda uçtan uca doğrulandı

### Gün 13 — Stok hareketleri ✅
- [x] `0014_stok_hareketleri.sql`: `stock_movements` (her hareket kayda bağlı: alış/satış/servis/iade/düzeltme/sayım/açılış) + `stok_hareketi_ekle()` RPC — ürün satırını `FOR UPDATE` ile kilitleyip miktarı günceller ve öncesi/sonrası ile birlikte hareketi kaydeder (eşzamanlı işlemler birbirini ezemez)
- [x] `service_parts` tablosu: servise parça eklendiğinde önce **rezerve edilir** (stok değişmez), teknisyen/yönetici onayladığında `stok_hareketi_ekle()` çağrılıp stoktan düşer ve satır `consumed` olur (Sprint 2'deki servis akışına bağlandı)
- [x] Sökülen parça akıbeti alanı: değişim (parça takas) işaretlenirse akıbet (müşteriye teslim / imha / hurda stoğu) + opsiyonel not tutuluyor
- [x] Ürün detay sayfası: stok hareket geçmişi (ikon, tip, neden, öncesi→sonrası, +/- rozet) + manuel stok düzeltme paneli (`StokDuzeltme`, sebep zorunlu — henüz alış modülü olmadığı için açılış stoğu bu yoldan giriliyor)
- [x] Servis detay sayfası: "Kullanılan Parçalar" paneli (`ServisParcalari`) — ürün arama, miktar, rezerve et, onayla (stoktan düş), sökülen parça akıbeti formu
- [x] **Canlı testte bulunan hata**: `stok_hareketi_ekle()` başlangıçta `SECURITY DEFINER` değildi; `stock_movements` tablosunda yalnızca SELECT RLS policy'si var (yazma sadece bu fonksiyon üzerinden olsun diye), fonksiyon `SECURITY DEFINER` olmayınca çağıran rol RLS'e takılıp "Stok güncellenemedi" hatası veriyordu. `0015_stok_hareketi_security_definer.sql` ile `audit_ekle()` ile aynı desene (`SECURITY DEFINER` + `SET search_path`) çekildi
- [x] E2E: throwaway tenant/kullanıcı/müşteri/cihaz/servis/ürünle tarayıcıda uçtan uca doğrulandı — parça rezerve edilince stok değişmedi (10→10), onaylanınca doğru düştü (10→8, `stock_movements` satırı `reference_type=service_order` ile doğru), değişim + sökülen parça akıbeti formu doğru render edildi, manuel stok düzeltme çalıştı (8→15), ikinci bir throwaway tenant ile çapraz-tenant erişim reddedildi (RPC "ürün bulunamadı veya erişim yok", `service_parts` select 0 satır)

### Gün 14 — Fiyat yönetimi ✅
- [x] `/panel/stok/fiyat-guncelle`: dövizli maliyetle otomatik fiyatlanan (`auto_price=true`, `purchase_currency != TRY`) ürünler güncel kurla yeniden hesaplanır, mevcut fiyattan farklı olanlar işaretli listelenir, seçilenler tek tıkla toplu güncellenir (`audit_ekle` ile `toplu_fiyat_guncellendi` kaydı). Ayarlar → Döviz Kurları'ndan doğrudan bağlantı eklendi
- [x] Fiyat listeleri: Stok listesinde **Perakende (KDV dahil) / Toptan (KDV hariç)** görünüm anahtarı (`kdvHaricFiyat()` — `src/lib/doviz.ts`); ürün detayında satış fiyatının altında toptan karşılığı da gösteriliyor
- [x] Kritik stok uyarıları: Genel Bakış'taki "Kritik Stok" kartı artık canlı sayım gösteriyor (önceden statik "—"), kritik ürün varsa üstte tıklanabilir kırmızı uyarı şeridi çıkıyor → `/panel/stok?kritik=1`'e yönlendiriyor
- [x] **Canlı testte bulunan hata**: Toplu güncelleme sonrası tüm ürünler güncel kurla uyumlu hale gelince (`degisenler` boşalınca) bileşen "tümü güncel" ekranına düşüyor ve az önce gösterilen "N üründe fiyat güncellendi" başarı mesajı kayboluyordu — `TopluFiyatGuncelle.tsx`'te bu ekranda da `sonuc` state'i gösterilecek şekilde düzeltildi
- [x] E2E: throwaway tenant'ta USD kuru elle 40 TL'ye ayarlandı, eski kurla (30 TL) hesaplanmış `sale_price`'lı bir ürün oluşturuldu; ürün detayında güncel kurla kâr marjının negatife düştüğü gözlemlendi (tam da bu ekranın çözdüğü sorun), toplu güncelleme sonrası fiyat 3.600→4.800 TL doğru hesaplandı ve DB'de doğrulandı, Perakende/Toptan görünüm anahtarı (500→416,67 TL, 3.600→3.000 TL) ve kritik stok uyarısı tarayıcıda uçtan uca doğrulandı

### Gün 15 — Stok disiplini ✅
- [x] Negatif stok politikası: `tenants.negative_stock_policy` (uyarılı/onaylı/yasak), Ayarlar → `StokPolitikasi` ile yönetiliyor. `stok_hareketi_ekle()` sonucu negatife düşerse politikaya göre davranıyor — yasak engeller (`STOK_YETERSIZ`), onaylı açık onay ister (`NEGATIF_STOK_ONAY_GEREKLI` → tarayıcı onayıyla `p_negatif_onay=true` ile yeniden gönderilir), uyarılı izin verip dönen negatif değerle çağıran tarafın uyarı göstermesini sağlar. `StokDuzeltme` ve `ServisParcalari` onay adımları bu akışa göre güncellendi
- [x] Sayım v1: `stock_counts` + `stock_count_items` tabloları, `sayim_baslat()/sayim_miktar_gir()/sayim_tamamla()/sayim_iptal()` RPC'leri (hepsi `SECURITY DEFINER`, `audit_ekle` deseniyle). Başlatınca aktif ürünlerin anlık stok görüntüsü alınır, sayılan miktar girildikçe kaydedilir, tamamlanınca farkı olan her ürün `stok_hareketi_ekle()` ile (`movement_type='count'`) otomatik düzeltilir. `/panel/stok/sayim` liste + detay sayfaları
- [x] Sprint 3'ün stok döngüsü tamamlandığı için `src/lib/menu.ts`'te Stok modülü "insa" → "aktif"
- [x] **Canlı testte bulunan hata**: 0016 migration'ında `stok_hareketi_ekle()`'ye `p_negatif_onay` parametresi eklenirken `create or replace function` imza (parametre listesi) değiştiği için fonksiyonun yerine geçmedi, ikinci bir overload olarak eklendi — iki overload birden varken varsayılan parametrelerle yapılan her çağrı "is not unique" hatası veriyordu (`sayim_tamamla` içindeki iç çağrı canlı testte patladı). `0017_stok_hareketi_overload_temizligi.sql` ile eski 6 parametreli sürüm açıkça düşürüldü
- [x] E2E: throwaway tenant'ta üç politika da (yasak/onaylı/uyarılı) hem manuel stok düzeltme hem servis parça onayı üzerinden doğrulandı (native `confirm()` diyaloglarını test edilebilir kılmak için `window.confirm` JS ile override edildi); sayım akışı uçtan uca (başlat → 2 ürünlük anlık görüntü → miktar gir → tamamla → stok 3→2 ve 10→12 düzeltmesi + `movement_type='count'` kayıtları) ve iptal akışı tarayıcıda doğrulandı; ikinci bir tenant ile sayım RPC'lerinde çapraz-tenant erişim reddi doğrulandı

**Sprint sonu:** USD'li alış → kur → TL satış fiyatı zinciri çalışıyor; her stok değişiminin "neden"i var.

---

## SPRINT 4 — SATIŞ VE KASA (Gün 16-20)

### Gün 16 — Hızlı satış ✅
- [x] POS ekranı (`/panel/satis`, `HizliSatis.tsx`): `F2 → ara/barkod → miktar → ödeme` klavye akışı. F2 panelin her yerinden POS'a gider (Ctrl+K ile aynı global kısayol deseni, `PanelKabuk.tsx`), POS ekranındaki arama kutusuna da F2 ile odaklanılır
- [x] Karma kalemler: tek satışta ürün + işçilik + hizmet bir arada (`sale_items.item_type`). `sales`/`sale_items`/`sale_no_counters` şeması + `satis_olustur()` RPC'si — satış başlığı, kalemler ve ürün kalemlerinin stok düşümü tek atomik işlemdir (`stok_hareketi_ekle()` üzerinden, bu sayede Gün 15'in negatif stok politikası satışlarda da otomatik geçerli). Satış no formatı `SN-YYYY-NNNNNN` (`service_no` ile aynı sayaç deseni)
- [x] Müşteri seç (opsiyonel, `MusteriSec`'in hızlı-kayıt akışı yeniden kullanıldı), ödeme yöntemi (nakit/kart/açık hesap — açık hesap müşteri gerektirir), sayfada son satışlar listesi
- [x] Menüde Satış modülü "yakında" → "insa" (Gün 16-20 boyunca inşa edilecek — stok modülünün Gün 11-15 deseniyle aynı)
- [x] E2E: karma kalemli satış (ürün + işçilik) tarayıcıda uçtan uca doğrulandı — stok düşümü, `stock_movements` kaydı, `sale_items` ayrımı; müşterili açık hesap satışı; "yasak" negatif stok politikasıyla aşırı satışın tamamen engellendiği ve kısmi kayıt/sayaç sıçraması oluşmadığı (tek transaction rollback); ikinci bir tenant ile hem RPC hem select üzerinden çapraz-tenant erişim reddi doğrulandı

### Gün 17 — İskonto ve ödeme ✅
- [x] Satır iskontosu (`sale_items.discount_amount`) + genel iskonto (`sales.discount_amount`) + "Küsuratı Sil" yuvarlama (`sales.rounding_amount`) — `satis_olustur()` RPC'si bunları hesaba katarak subtotal/total'ı yeniden hesaplıyor
- [x] Rol bazlı iskonto limiti: kasiyer %10, owner/manager sınırsız (`yetki.ts` → `ISKONTO_LIMITLERI`, aynı sınır `satis_olustur()` içinde sunucu tarafında da uygulanıyor — istemci yalnız UX). Limit aşımında RPC `ISKONTO_ONAY_GEREKLI` döner; **PIN yerine yönetici e-posta/parola onayı** (`YoneticiOnayModal` + `dogrulama.ts`) — izole, `persistSession:false` bir istemciyle doğrulanır, kasiyerin oturumu hiç etkilenmez; onaylayanın owner/manager + aynı tenant olduğu RPC içinde bağımsızca tekrar doğrulanıyor
- [x] Karma ödeme: `sale_payments` tablosu (yöntem + tutar + taksit), tek satıştan birden çok ödeme satırı (örn. 400 nakit + 600 kart). Taksit sayısı tenant'ın `max_installments` ayarına göre sunucuda doğrulanıyor (`TAKSIT_LIMITI_ASILDI`) — Ayarlar'da `TaksitAyari` ile yönetiliyor (parametrik, kural motoru değil — bilinçli v1 kapsamı)
- [x] `HizliSatis`: satır başına indirim alanı, genel iskonto + yuvarlama butonu, tek ödeme (Gün 16'daki sade 3 butonluk akış varsayılan olarak korundu) / karma ödeme geçişi (satır ekle, taksit seç, kalan gösterge)
- [x] E2E: kasiyer hesabıyla %20 satır iskontosu → onay isteniyor → yanlış parola reddediliyor → doğru parola ile owner onayı → satış tamamlanıyor ve `created_by` hâlâ kasiyer (oturum hiç değişmedi — izole doğrulama istemcisi doğru çalıştı); genel iskonto + yuvarlama (1000 → 333,33 iskonto → 0,67 yuvarlama → 666 TL) doğru hesaplandı; karma ödeme (400 nakit + 600 kart, 3 taksit) DB'de doğru satırlarla kaydedildi; taksit limiti sunucu tarafında zorlanıyor (azami 3 iken 6 taksit reddedildi); `sale_payments` için çapraz-tenant erişim reddi doğrulandı

### Gün 18 — Kasa ve tahsilat ✅
- [x] Kasa hesapları (nakit/banka/POS): `cash_accounts` + `cash_movements` + `kasa_hareketi_ekle()` RPC — `stok_hareketi_ekle()` ile birebir aynı desen (`FOR UPDATE` kilidi, bakiye önce/sonra kaydı). `/panel/finans`: hesap listesi + toplam bakiye + hesap detayında hareket geçmişi, yeni hesap oluşturma (owner/manager)
- [x] Satış ödemeleri kasaya bağlandı: `sale_payments.account_id`, her nakit/kart ödeme satırı `satis_olustur()` içinde `kasa_hareketi_ekle()` çağırıyor (açık hesap hariç — cari borç doğuyor, kasaya para girmiyor). `HizliSatis`'te ödeme yöntemi seçilince uygun tipteki hesap tek ise otomatik seçiliyor
- [x] Servis kapora/avans + kapanış tahsilatı + mahsup: `servis_tahsilat_al()` RPC'si (`'kapora'|'kapanis'`), her ikisi de `kasa_hareketi_ekle()` çağırır; kapora ayrıca `service_orders.advance_paid`'i artırır. `ServisTahsilat` bileşeni servis süresince her an kapora alınmasını sağlıyor; `TeslimPaneli`'de toplam tutar girilince "Kalan Tahsilat = toplam − alınan kapora" canlı hesaplanıyor (mahsup budur, ayrı mekanizma gerekmedi) ve teslim tamamlanırken tahsil ediliyor
- [x] Bu finansal işlemler `servis_yonet` değil `kasa_yonet` (owner/manager/cashier) ile ayrı yetkilendirildi — teknisyen teslimatı tamamlayabilir ama para tahsilatı ayrı bir yetki (`yetki.ts`'e `kasa_yonet` eklendi). Menüde Finans "yakında" → "insa"
- [x] E2E: iki kasa hesabı (Ana Kasa, Garanti POS) oluşturuldu; bir satış otomatik olarak Ana Kasa'ya 500 TL işlendi ve hareket geçmişinde doğrulandı; bir serviste 300 TL kapora alınıp teslimde 850 TL toplam girilerek Garanti POS'tan 550 TL kalan tahsil edildi — `advance_paid`, `final_cost` ve her iki kasa hareketi DB'de doğru bulundu; yeni RPC'lerde (`kasa_hareketi_ekle`, `servis_tahsilat_al`) ve `cash_accounts` select'inde çapraz-tenant erişim reddi doğrulandı

### Gün 19 — Gider + kasa kapanışı ✅
- [x] Gider modülü: `expenses` (kategori, açıklama, tutar, kasa hesabı, `is_recurring`/`recurrence_day`, fiş fotoğrafı) + `gider_ekle()` RPC — kaydı oluşturur ve `kasa_hareketi_ekle()` ile ilgili hesabı düşer. `/panel/finans/giderler`: hızlı giriş formu (kategori → tutar → kasa → kaydet), fiş fotoğrafı `servis-belgeleri` bucket'ının tenant-scoped politikası yeniden kullanılarak yükleniyor
- [x] Tekrarlayan gider hatırlatması: her (kategori, açıklama) çiftinin en son kaydı bu ayla karşılaştırılıp "bu ay henüz girilmedi" bandı gösteriliyor — ayrı bir bildirim/cron altyapısı gerekmeden
- [x] Kasa kapanışı: `cash_closings` + `kasa_kapat()` RPC (beklenen sistem bakiyesi vs fiili sayılan tutar, fark varsa açıklama hem istemci hem sunucu tarafında zorunlu). Fark varsa `kasa_hareketi_ekle()` ile (`'duzeltme'`) hesabın önbelleklenen bakiyesi fiili tutara eşitleniyor — Gün 15'teki sayım (stok) deseniyle birebir aynı mantık. Hesap başına günde bir kapanış (unique constraint), geçmiş kapanışlar listeleniyor
- [x] **Canlı testte bulunan hata**: `kasa_kapat()` "bugün"ü Postgres sunucusunun (UTC) `current_date`'i ile hesaplıyordu; gece yarısına yakın saatlerde (00:00-03:00 Türkiye saati) kapanış bir önceki güne kaydediliyordu. `Europe/Istanbul` saat dilimi açıkça kullanılacak şekilde düzeltildi (0022) — hem RPC hem sayfadaki "bugün" karşılaştırması
- [x] E2E: geçen aya ait tekrarlayan bir gider hatırlatma bandında doğru göründü; yeni gider eklenince kasa hesabı doğru düştü; fark olmayan ve fark olan (açıklama zorunlu) kasa kapanışı senaryoları test edildi, düzeltme hareketi ve bakiye eşitlemesi DB'de doğrulandı, saat dilimi düzeltmesi sonrası doğru güne kaydedildiği doğrulandı; yeni RPC'lerde çapraz-tenant erişim reddi doğrulandı

### Gün 20 — Belge ve iade ✅
- [x] Belge tipi seçimi: `sales.document_type` (`'okc_fisi'|'sonra_kesilecek'`) + `receipt_no` + `document_issued_at`. `HizliSatis`'te satış kapanışında seçim (varsayılan sonra kesilecek — akışı yavaşlatmaz). `/panel/satis/belgeler`: belgesi kesilmemiş satışlar kuyruğu, `satis_belgesini_kes()` ile geriye dönük fiş no girilip belge kapatılıyor
- [x] İlk kez satış detay sayfası (`/panel/satis/[id]`) — bu güne kadar yoktu, belge/iade akışları için ön koşuldu: kalemler, ödeme dökümü, belge durumu, her ürün kalemi için "İade Al"
- [x] İade akışı: `returns` tablosu (`İA-YYYY-NNNNNN` sayaç) + `iade_baslat()` (orijinal satış kalemi zorunlu, kümülatif iade miktarı satılan miktarı aşamaz) + `iade_kontrol_et()` (Satılabilir → stoğa geri alınır / Arızalı, Hurda → dönmez / Servise → yeni bir `service_orders` kaydı açılır, müşteri şart). Nakit iade seçilirse `kasa_hareketi_ekle()` ile ilgili hesaptan düşülür. `/panel/satis/iadeler`: kontrol bekleyen iadeler kuyruğu
- [x] "Açık hesap mahsup" iade yöntemi olarak bilinçli dahil edilmedi — cari/borç-alacak altyapısı henüz yok (Gün 22), üzerine inşa edilecek yarım bir mekanizma yerine yalnız nakit iade / iade yok desteklendi
- [x] Sprint 4 tamamlandığı için menüde Satış ve Finans "insa" → "aktif"
- [x] E2E: bir satış "sonra kesilecek" ile tamamlandı, belge kuyruğunda göründü, geriye dönük fiş no ile kesildi; kısmi iade (2 satılan, 1 iade) başlatıldı, kontrol öncesi stoğun değişmediği doğrulandı, "satılabilir" sonucuyla stok ve kasa (nakit iade) doğru güncellendi; ikinci bir iade "servise" sonucuyla doğru `declared_issue`/`customer_id` ile yeni servis kaydı oluşturdu; müşterisiz (misafir) satıştan "servise" denemesi reddedildi; ilgili RPC'lerde çapraz-tenant erişim reddi doğrulandı

**Sprint sonu:** 🎯 Sabah satış → akşam kasa kapanışı döngüsü gerçek dükkân temposunda tamam.

---

## SPRINT 5 — ALIŞ, TEDARİKÇİ, CARİ (Gün 21-24)

### Gün 21 — Tedarikçi + alış ✅
- [x] `0027_tedarikci_alis.sql`: `suppliers` (ad, para birimi, IBAN, telefon, adres — müşteri deseniyle aynı, hard delete yok) + `purchases`/`purchase_items` (alış no `AL-YYYY-NNNNNN`, tedarikçi fatura no, geriye dönük fatura tarihi, para birimi + o anki kur snapshot'ı) — uygulandı
- [x] `alis_olustur()` RPC: alış + kalemler + stok girişi (`stok_hareketi_ekle()` üzerinden, `movement_type='purchase'`) + ürün maliyeti güncelleme + `auto_price` açık ürünlerde satış fiyatının anında yeniden hesaplanması tek atomik işlemde (Gün 16'daki `satis_olustur()` ile aynı desen)
- [x] `TedarikciSec` bileşeni (Gün 10'daki `MusteriSec` deseniyle — akıştan çıkmadan hızlı tedarikçi oluşturma) + `AlisFormu` (tedarikçi seç → ürün ara/ekle → miktar/birim fiyat → kur → ödeme durumu)
- [x] Tedarikçiler (liste/detay/düzenle, detayda alış geçmişi) ve Alış (liste/detay) sayfaları; menüde her iki modül "yakında" → "aktif"
- [x] Bilinçli kapsam dışı (Gün 20'deki "açık hesap mahsup" kararıyla aynı gerekçe): tedarikçi cari/borç takibi henüz yok — `payment_status` yalnız bilgi amaçlı, kasaya bağlı değil; gerçek cari Gün 22'de
- [x] E2E: dövizli alış (10 adet × 22 USD, kur 40) tarayıcıda uçtan uca doğrulandı — stok 5→15, ürün alış maliyeti 20→22 USD, `auto_price` açık ürünün satış fiyatı 1000→1100 TL otomatik yeniden hesaplandı, `stock_movements` kaydı (`movement_type='purchase'`, referans alışa bağlı) ve tedarikçi/alış detay sayfaları doğrulandı

### Gün 22 — Cari ✅
- [x] `0028_cari.sql`: `customers.balance`/`suppliers.balance` (+ `suppliers.avg_exchange_rate`) + `customer_ledger`/`supplier_ledger` hareket tabloları — `stock_movements`/`cash_movements` ile aynı desen (öncesi/sonrası bakiye, referans, audit)
- [x] Ortak primitifler `musteri_borc_ekle()`/`tedarikci_borc_ekle()` (`stok_hareketi_ekle()` ile birebir aynı mimari) — `satis_olustur()` artık açık hesap ödemesinde kasaya dokunmadan müşteri borcu yaratıyor, `alis_olustur()` her alışta tedarikçi borcu yaratıyor
- [x] `musteri_tahsilat_al()` RPC — borcu kasaya tahsil edip düşer; müşteri detayında "Cari Bakiye" kartı + "Tahsilat Al" formu + Cari Hareketler listesi
- [x] Dövizli tedarikçi cari: borç arttıkça **ağırlıklı ortalama maliyet kuru** (`avg_exchange_rate`) güncellenir (Gün 27'deki stok maliyet yöntemi konseptinin küçük bir öncüsü); `tedarikci_odeme_yap()` ödeme anında bu ortalama ile ödeme kuru arasındaki farkı, nakit hareketi yaratmadan ayrı bir "Kur Farkı" muhasebe kaydı olarak otomatik işler (kur yükseldiyse gider, düştüyse gelir)
- [x] Bilinçli kapsam dışı: fatura-fatura eşleştirme yok — genel bakiye modeli; `purchases.payment_status` artık yalnız bilgi amaçlı not, gerçek borç `suppliers.balance`'da. Fatura eşleştirme/yaşlandırma Gün 24'e planlı
- [x] Kılavuza Tedarikçiler ve Alış konuları eklendi (artık aktif modüller), Müşteriler konusu cari bölümüyle güncellendi
- [x] E2E: gerçek kullanıcı oturumuyla (service-role değil) uçtan uca doğrulandı — açık hesap satış (1000 TL) → müşteri borcu 1000, kısmi tahsilat (400) → borç 600, UI'dan tam tahsilat → borç 0 ve buton kayboldu; dövizli alış (50 USD, kur 40) → tedarikçi borcu 50 USD/ort. kur 40; kısmi ödeme (20 USD, kur 42) → kalan 30 USD, ort. kur **değişmedi** (40'ta sabit kaldı — doğru ağırlıklı ortalama davranışı), kur farkı 40 TL gider olarak ayrı kayda düştü; UI'dan ikinci ödeme (10 USD, kur 39) → bakiye 0, kur farkı 10 TL gelir olarak doğru işlendi. **Canlı testte bulunan hata:** `tedarikci_borc_ekle()` ödemeleri de `'alis_borc'` etiketiyle kaydediyordu (entry_type parametresi yoktu) — Cari Hareketler listesinde bir ödeme "Alış borcu: -20 USD" gibi yanıltıcı görünüyordu; `p_entry_type` parametresi eklenip (`tedarikci_odeme_yap()` artık `'odeme'` geçiyor) düzeltildi ve doğrulandı

### Gün 23 — Satın alma talepleri
- [ ] Talep ekranı (servisten "parça bekleniyor" + kritik stoktan otomatik)
- [ ] Parça geldi → alış → stok → servise otomatik bağlanma (S3 senaryosu)

### Gün 24 — Cari çıktılar
- [ ] Cari ekstre PDF + yaşlandırma (30/60/90)
- [ ] Cari açılış bakiyesi import'u (devir)

**Sprint sonu:** Toptancıya USD borç doğru izleniyor; S3 uçtan uca çalışıyor.

---

## SPRINT 6 — DASHBOARD, RAPOR, KONSOL (Gün 25-30)

### Gün 25 — Dashboard
- [ ] Rol bazlı gerçek kartlar (satış, tahsilat, açık servisler, kritik stok, kur etkisi, teslim alınmayanlar)
- [ ] Akıllı özet cümleleri

### Gün 26 — Raporlar I
- [ ] Satış raporları (gün/ay/ürün/personel/iskonto) + servis raporları (süre, teknisyen, tekrar)

### Gün 27 — Raporlar II
- [ ] Kârlılık (maliyet yöntemi seçilebilir) + stok raporları
- [ ] Muhasebeci paketi v1 (ay sonu Excel export)

### Gün 28 — Yönetim Konsolu v1a
- [x] ~~Konsol yüzeyi + `platform_admins` + Master Admin seed~~ → **öne alındı, kullanıcı talebiyle bugün (Gün 9-10 arası) inşa edildi** (bkz. altta). MFA + tam ayrı kimlik alanı (Bölüm 63) hâlâ bu güne planlı.
- [x] Tenant listesi (temel) — Tenant 360°'nin ilerisi (`tenant_events`, uzatma/askıya alma) bu güne planlı

### Ek — Konsol v0 ✅ (kullanıcı talebiyle öne alındı)
- [x] `0010_konsol_v0.sql`: `platform_admins`, `is_platform_admin()`, `admin_tenant_listesi()`/`admin_tenant_detay()` (SECURITY DEFINER RPC'ler — tenant RLS'i gevşetmeden çapraz-tenant erişim) — uygulandı
- [x] **İlk Master Admin seed edildi: mozkarci1991@gmail.com** (role='master')
- [x] `/konsol`: ayrı üst bar (tenant menüsü yok), istatistik kartları (toplam işletme, son 7 gün yeni, deneme, aktif), arama, tenant tablosu
- [x] `/konsol/[id]`: tenant detayı — bilgiler, kullanıcı listesi, müşteri/cihaz/servis sayaçları
- [x] middleware: `/konsol/**` oturumsuz erişime kapalı; layout `is_platform_admin()` kontrolüyle yetkisiz tenant kullanıcısını `/panel`'e geri yönlendiriyor
- [x] E2E: normal tenant kullanıcısı RPC'yi çağıramıyor (400 "yetkisiz") doğrulandı
- [ ] MFA zorunluluğu + tam ayrı kimlik alanı, uzatma/askıya alma/plan değişikliği, `tenant_events`, feature flag yönetim ekranı — Gün 28-30 planında duruyor (bu adım o işi tekrarlamayacak şekilde kuruldu)

### Gün 29 — Abonelik Planları + Yönetim Konsolu v1b
Kapsam kullanıcı talebiyle netleştirildi (17.08.2026): ByteNova'nın kendi
abonelik planları (addon'lardan ayrı — addon'lar ek modül, bu planlar
tenant'ın temel aboneliği) tanımlanacak ve Konsol'a, master admin'in bir
işletmenin aboneliğine doğrudan müdahale edebileceği bir ekran eklenecek
(bugün yalnızca "Deneme: 12g" gibi salt-okunur bir rozet var, üzerinde
işlem yapılamıyor).

- [ ] **Plan kataloğu:** `subscription_plans` (örn. Başlangıç / Profesyonel /
  Kurumsal) — her planda özellik/limit seti (kullanıcı sayısı, modül
  erişimi vb.) + **aylık ve yıllık fiyat** (yıllık, indirimli tek kalem)
- [ ] Tenant'a plan + faturalama döngüsü (aylık/yıllık) atanması
  (`tenants.plan_id`, `billing_cycle`); işletme sahibi kendi planını
  Ayarlar'da (yeni "Abonelik" bölümü) görebilir
- [ ] Abonelik yaşam döngüsü: Trial → Aktif → Ödeme Bekliyor → Askıda +
  trial bitince otomatik durum geçişi
- [ ] **Konsol'dan müdahale (S63-ish, kullanıcı talebiyle öne çıkarıldı):**
  tenant detayında master admin şunları yapabilmeli:
  - Deneme süresini uzatma (gün ekle veya yeni bitiş tarihi seç)
  - Plan değiştirme (yükselt/düşür) ve faturalama döngüsünü değiştirme
  - Durumu manuel değiştirme (Aktif yap / Askıya al / Yeniden etkinleştir)
  - Her işlem gerekçe ister, `platform_audit_logs` + tenant'ın kendi
    `audit_logs`'una işlenir — kasa kapanışı geri almadaki şeffaflık
    deseniyle birebir aynı (Gün 23): işletme sahibi "ByteNova destek
    tarafından değiştirildi" kaydını her zaman görebilmeli
- [ ] Askıdaki tenant salt-okunur deneyimi (veriye erişim var, işlem yok)
- [ ] Manuel ödeme (havale/dekont onay) akışı — dekont yükleme + Konsol'dan
  onaylayınca abonelik otomatik "Aktif"e döner

> Not: Otomatik/online tahsilat (kart ile aylık/yıllık otomatik çekim,
> `BillingProvider` soyutlaması) bu güne dahil değil — Sprint 9-12,
> madde 4'te ayrı bir iş olarak planlı; Gün 29 yalnızca planların
> tanımını ve manuel/idari yönetimini kapsar.

### Gün 30 — Sertleştirme
- [ ] Admin davet/rol yönetimi + `platform_audit_logs` + feature flag yönetim ekranı
- [x] ~~Eklenti mimarisi temeli~~ → **öne alındı, kullanıcı talebiyle bugün (Gün 8 arası) inşa edildi** (bkz. altta)
- [ ] Konsol'da paket toggle ekranı (Master Admin tarafı — tenant tarafı zaten çalışıyor)
- [ ] RLS güvenlik taraması + E2E test paketi (S1, S2, S3) + performans geçişi

### Ek — Eklenti (Add-on) Pazarı v1 ✅ (kullanıcı talebiyle öne alındı)
- [x] `0008_eklentiler.sql`: `addon_packages`, `tenant_addon_subscriptions`, `addon_usage_events` + RLS + 8 paketlik lansman kataloğu (uygulandı)
- [x] `ModulDurum`'a `kilitli` durumu; `menu.ts`'e `addonKey` alanı (Teklifler/Sözleşmeler→kurumsal_satis, Belgeler→e_belge, PC Toplama→pc_toplama, Pazaryeri→pazaryeri, Bildirimler→whatsapp_sms)
- [x] `efektifMenu()`: aktif+addonKey'li modül, abonelik yoksa otomatik `kilitli`
- [x] Ayarlar → **Eklentiler**: katalog kartları, gerçek "Etkinleştir/Devre Dışı Bırak" switch'i (owner/manager, audit'li, iptalde veri silinmez)
- [x] `[...modul]` "Çok Yakında" ekranı artık addon'lu modüllerde fiyat + "Eklentiler Sayfasına Git" CTA'sı gösteriyor
- [x] Müşteriler listesinde CRM Plus üst satış kartı (yalnız abone değilken görünür)
- [x] WhatsApp balonu panelde gizlendi, Ayarlar → Destek'e taşındı (kullanıcı talebiyle)
- [x] E2E: paket kataloğu görüntüleme, etkinleştirme (audit'li), rozet güncellemesi, upsell kartının kaybolması doğrulandı
- [ ] Otomatik ödeme (BillingProvider) + Konsol tarafı toggle — Sprint 11 planında duruyor

**Sprint sonu:** 🎯 **MVP çekirdeği canlıda** — işletmeler kayıt olup çalışabilir, sen konsoldan yönetebilirsin.

---

## SPRINT 7-8 — DERİNLİK VE CİLA (Hafta 5-6)

Sıra pilot geri bildirimiyle revize edilir:

- [ ] Showroom tam sürüm (modül turu, fiyatlandırma, SSS, canlı demo, SEO)
- [ ] Excel import sihirbazı tam set (müşteri/ürün/stok/cihaz/açık servis)
- [ ] Servis derinliği: teslim alınmayan cihaz otomasyonu, ücretli teşhis, servis garantisi ilişkisi, kanban görünümü, azami süre sayacı
- [ ] Teklif modülü + PDF
- [ ] Dijital ürün (lisans key) + demo veri seti
- [ ] Kurulum sihirbazı tam sürüm + onboarding dokümanları
- [ ] 2-3 gerçek bilgisayarcıyla **pilot başlangıcı**

## SPRINT 9-12 — P1 MODÜLLERİ (Hafta 7-12)

Öngörülen öncelik (pilot verisiyle güncellenir):

1. **WhatsApp/SMS + İYS** — sağlayıcı soyutlaması, servis bildirimleri, onay linki
2. **e-Belge** — entegratör soyutlaması + ilk entegratör, gider pusulası, portal modu
3. **Çek/Senet + POS mutabakat** — portföy, vade takvimi, nakit akış uyarıları
4. **Otomatik abonelik tahsilatı** — `BillingProvider` (iyzico/PayTR), dunning, impersonation
   - **Eklenti self-servis switch'i** aynı işte: tenant panelinde Ayarlar → Eklentiler, otomatik ödeme + kullanım bazlı faturalama (`docs/EKLENTI_MIMARISI.md`). İlk paketler: WhatsApp/SMS ve e-Belge.
5. **PC Toplama (BOM)** — reçete, toplama emri, demontaj
6. **Toptancı XML** — ilk 2-3 distribütör adaptörü
7. **Müşteri servis takip sayfası** (QR) + bakım sözleşmeleri + prim + uyumluluk matrisi + ÖKC entegrasyonu

## SPRINT 13+ — MASAÜSTÜ (OFFLINE) VE P2 (Hafta 13+)

- [ ] Tauri kabuğu + lokal SQLite replika + outbox senkron + çakışma kutusu
- [ ] Donanım köprüsü (termal/etiket yazıcı, barkod okuyucu, ÖKC)
- [ ] Çok şube, mobil teknisyen, pazaryeri, kargo, AI asistan, marketplace

---

## İLERLEME TABLOSU

| Sprint | Kapsam | Durum |
|---|---|---|
| 0 (Gün 1-2) | Canlıya çık + Auth | ✅ Tamamlandı — site canlıda |
| 1 (Gün 3-5) | Panel iskeleti + flag + roller | ✅ Tamamlandı |
| 2 (Gün 6-10) | Müşteri + Servis çekirdeği | ✅ Tamamlandı — dükkânda kullanılabilir ilk sürüm |
| 3 (Gün 11-15) | Ürün + Stok + Döviz | Bekliyor |
| 4 (Gün 16-20) | Satış + Kasa + Gider | Bekliyor |
| 5 (Gün 21-24) | Alış + Cari | Bekliyor |
| 6 (Gün 25-30) | Dashboard + Rapor + Konsol = MVP | 🔨 Konsol v0 öne alınıp tamamlandı (Gün 28-30'un temeli) |
| 7-8 | Derinlik + pilot | Bekliyor |
| 9-12 | P1 modülleri | Bekliyor |
| 13+ | Masaüstü/Offline + P2 | Bekliyor |

> Modül ayrıntıları için proje dosyasının ilgili bölümleri esastır: Servis (B12), Satış (B14), Alış (B15), BOM (B16), Stok (B17), İkinci el (B19), Kasa (B21), Çek/Senet (B22), Cari (B23), Gider (B24), Konsol (B63-68).
