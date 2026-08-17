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

### Gün 23 — Satın alma talepleri ✅
- [x] `0029_satin_alma_talepleri.sql`: `purchase_requests` (kaynak: servis/kritik_stok/manuel; durum: bekliyor/sipariş edildi/karşılandı/iptal) + `satin_alma_talebi_olustur()`/`satin_alma_talebi_iptal()` RPC'leri
- [x] Kritik stoktan **tamamen otomatik** talep: `products` üzerinde `stock_quantity` değiştiğinde çalışan bir trigger, ürün kritik seviyeye YENİ düşüyorsa (önceden kritik değildi) ve zaten açık talebi yoksa otomatik talep açar — cron/manuel kontrol gerekmez, ve zaten kritikken gelen küçük hareketlerde tekrar tekrar talep açılmaz
- [x] Servisten talep: `ServisParcaTalebi` bileşeni (servis detayında, `ServisParcalari`'nin hemen altında) — ürün ara/seç, miktar, not
- [x] `alis_olustur()` genişletildi: her kalem işlenirken o ürüne ait en eski açık talebi otomatik "karşılandı" işaretler (`fulfilled_purchase_id` ile alışa bağlanır); talep bir servise bağlıysa o servisin Teknik Notlar'ına "📦 Talep edilen parça geldi" sistem notu otomatik düşer (S3 senaryosu — servise otomatik bağlanma)
- [x] `/panel/alis/talepler`: tüm açık/geçmiş talepleri kaynak rozetiyle (🔧 Servis / ⚠️ Kritik Stok / ✍️ Manuel) listeleyen, elle talep oluşturma ve iptal destekleyen sayfa; her talepten tek tıkla ürün+miktar önceden dolu "Yeni Alış" formuna geçiş
- [x] Kılavuza "Parça Talebi" (Servisler) ve "Satın Alma Talepleri" (Alış) bölümleri eklendi
- [x] Bilinçli kapsam dışı: bir alıştaki tek bir kalem yalnızca o ürüne ait EN ESKİ açık talebi karşılar (miktar bölüştürme/kısmi karşılama yok) — birden çok açık talep varsa fazlası için ayrı alış girilir; bu, gerçek bir sipariş/tedarik zinciri motoru kurmadan makul ve öngörülebilir bir sınır
- [x] E2E: gerçek kullanıcı oturumuyla uçtan uca doğrulandı — stok kritiğin altına düşünce otomatik talep açıldı, tekrar düşüşte yeni talep AÇILMADI (yinelenme engeli çalıştı), servisten manuel talep oluşturuldu, art arda iki alışla önce kritik stok talebi sonra servis talebi otomatik karşılandı ve servis notu doğru içerikle düştü; `/panel/alis/talepler` ve servis detayındaki "Parça Talebi" kartı tarayıcıda görsel olarak doğrulandı

### Gün 24 — Cari çıktılar ✅
- [x] Cari ekstre PDF: `@react-pdf/renderer` ile Gün 10'daki servis belgesi mimarisiyle birebir aynı desen (`src/lib/pdf/olustur.ts` + yeni `MusteriEkstresi.tsx`/`TedarikciEkstresi.tsx` bileşenleri) — `/api/musteri/[id]/ekstre` ve `/api/tedarikci/[id]/ekstre` route'ları, tüm cari hareketleri tarih/açıklama/borç/alacak/bakiye tablosunda listeler; müşteri ve tedarikçi detay sayfalarındaki Cari Bakiye kartından tek tıkla indirilir
- [x] Yaşlandırma (30/60/90): fatura-fatura eşleştirme yapmadan (Gün 22'nin genel bakiye modeliyle tutarlı), FIFO varsayımıyla salt-okunur bir RAPOR olarak hesaplanıyor (`src/lib/cari.ts` → `yaslandirmaHesapla()`) — cari modelin kendisi değişmiyor, yalnızca mevcut hareketler okunup yorumlanıyor. Yeni `/panel/finans/cari-yaslandirma` sayfası müşteri alacaklarını ve tedarikçi borçlarını ayrı tablolarda, 90+ gün kırmızı vurgulu olarak listeler
- [x] Cari açılış bakiyesi (devir): `musteri_acilis_bakiyesi_belirle()`/`tedarikci_acilis_bakiyesi_belirle()` RPC'leri — yalnızca o müşteri/tedarikçide HİÇ cari hareket yokken kullanılabilir (sunucu tarafında zorlanır), böylece gerçek bir işlemi geriye dönük "düzeltme" amacıyla kötüye kullanma riski yok. `customer_ledger`/`supplier_ledger` check constraint'lerine yeni `acilis_bakiyesi` entry_type'ı eklendi
- [x] E2E: gerçek kullanıcı oturumuyla doğrulandı — PDF endpoint'leri gerçek `%PDF-` başlıklı, doğru `Content-Disposition` (`inline`/`attachment=1`) ve doğru dosya adıyla 200 döndü; açılış bakiyesi RPC'si başarıyla kaydetti ve ikinci çağrıda beklendiği gibi reddedildi; yaşlandırma algoritması ayrıca izole bir senaryoyla (kısmi tahsilatların FIFO'yla en eski borcu doğru kapattığı) doğrulandı. **Canlı testte bulunan hata:** müşteri/tedarikçi detay sayfalarındaki Cari Hareketler listesi yeni `acilis_bakiyesi` tipini tanımıyor, "Düzeltme" olarak yanlış gösteriyordu — etiket haritalarına eklenip düzeltildi

**Sprint sonu:** 🎯 Sprint 5 tamamlandı — toptancıya USD borç doğru izleniyor, cari tamamen çalışıyor, S3 uçtan uca akıyor.

---

## SPRINT 6 — DASHBOARD, RAPOR, KONSOL (Gün 25-30)

### Gün 25 — Dashboard ✅
- [x] Genel Bakış'taki tüm placeholder ("—") kartlar gerçek sorgulara bağlandı: Bugünkü Satış (o günkü tüm satışların toplamı, açık hesap dahil), Bugünkü Tahsilat (yalnızca kasaya gerçekten giren tutar — `cash_movements` pozitif hareketleri, açık hesap satışlar bilinçli olarak dahil değil), Açık Servisler (kapanmış durumlar hariç sayım), Bugün Teslimler, Onay Bekleyen
- [x] **Kur Etkisi** kartı: Gün 22'deki `suppliers.avg_exchange_rate`'in yeniden kullanımıyla — açık dövizli tedarikçi borcu bugün kapatılsaydı oluşacak kur farkını (gider/gelir) gösterir; yeni bir kur geçmişi altyapısı kurulmadan, mevcut veriden türetildi
- [x] Kartlar **rol bazlı**: her kart ilgili yetkiye (`satis_yap`/`kasa_yonet`/`servis_yonet`/`maliyet_gor`) sahip olmayan roller için hiç render edilmiyor — örn. bir teknisyen satış/kasa rakamlarını görmez
- [x] **Akıllı özet cümleleri**: üstteki metin artık o günün gerçek verisinden üretilen, koşullu (o gün hareket yoksa görünmeyen) doğal dil cümleleri
- [x] Servis listesine (`/panel/servisler`) `durum` query param filtresi eklendi — dashboard kartları "Onay Bekleyen"/"Bugün Teslimler" gibi durumlara doğrudan deep-link verebiliyor
- [x] Kılavuzdaki "Genel Bakış" konusu gerçek davranışı anlatacak şekilde yeniden yazıldı (eski "henüz bağlanmadı" uyarısı kaldırıldı)
- [x] E2e: gerçek kullanıcı oturumuyla uçtan uca doğrulandı — karma (nakit + açık hesap) iki satış, bir teslim edilmiş ve bir onay bekleyen servis, dövizli bir alış + sonradan değişen kur ile tüm kartlar ve akıllı özet cümleleri doğru rakamlarla (₺600 satış / ₺300 tahsilat / +₺250 kur etkisi vb.) render edildiği doğrulandı

### Gün 26 — Raporlar I ✅
- [x] `/panel/raporlar`: Satış ve Servis sekmeli, tarih aralığı seçili (7/30/90/365 gün) rapor sayfası — `rapor_gor` yetkisi (Sahip/Yönetici/Muhasebe) ile korunuyor. Saf hesaplama mantığı `src/lib/raporlar.ts`'te (cari yaşlandırma ile aynı desen — sorgulanan satırlar üzerinde JS'te agregasyon, DB'ye yeni RPC eklenmedi)
- [x] Satış raporları: gün/ay bazlı seri (toggle), en çok satan ürünler (top 10), personel performansı (satış adedi/tutar/iskonto oranı), toplam iskonto — hem satır hem genel iskontoyu birlikte sayıyor
- [x] Servis raporları: ortalama süre (kabul→teslim, yalnız teslim edilmişler), teknisyen performansı, tekrar eden cihazlar (tüm zamanlar, tarih aralığından bağımsız — sık arızalanan cihazları öne çıkarır)
- [x] Servis listesine (Gün 25'te eklenen) `durum` filtresine ek olarak dashboard/rapor kartlarının kullandığı deep-link deseni bu günde de korundu
- [x] Menüde Raporlar "yakında" → "aktif"; kılavuza yeni "Raporlar" konusu eklendi (kalan kapsam — kârlılık/stok değeri/muhasebeci paketi — Gün 27'ye not düşüldü)
- [x] **Canlı testte bulunan hata:** "Toplam İskonto" ve personel iskonto oranı yalnızca `sales.discount_amount` (genel iskonto) alanını sayıyordu, HizliSatis'te asıl sık kullanılan SATIR iskontosunu (`sale_items.discount_amount`) hiç hesaba katmıyordu — gerçek bir satır-iskontolu satışla test edilirken fark edildi (₺20 iskonto ₺0 gösteriyordu), `sale_items` sorgusuna `discount_amount` eklenip satış başına toplanacak şekilde düzeltildi ve doğrulandı (₺20 / %1.8 doğru çıktı)
- [x] E2E: gerçek kullanıcı oturumuyla, karma iskonto/ödeme yöntemli 3 satış ve tekrar eden cihazlı 2 servis senaryosuyla tüm rakamlar (toplam, seri, ürün, personel, süre, teknisyen, tekrar) doğrulandı

### Gün 27 — Raporlar II ✅
- [x] `0031_karlilik_maliyet_snapshot.sql`: `sale_items.unit_cost` eklendi — `satis_olustur()` her ürün kalemi için satış anındaki maliyeti (`products.purchase_price`, dövizliyse tenant override → global TCMB kuruyla TL'ye çevrilerek) donmuş halde kaydediyor; imza değişmedi, düz `create or replace` yeterliydi
- [x] Kârlılık raporu iki yöntem arasında seçilebilir: "Satış Anındaki Maliyet" (`unit_cost`, bu migration'dan önceki satışlarda null — o kalemler ayrı sayılıp toplam kâra karıştırılmıyor) vs "Güncel Maliyet" (`products.purchase_price` bugünkü kurla yeniden hesaplanır); yalnızca Satış (POS) modülünü kapsıyor, servis geliri (`final_cost`) dahil değil — kod içinde açıkça not düşüldü. Tutarlar KDV dahil (satır bazlı KDV anlık görüntüsü yok — bilinçli sınırlama)
- [x] Stok değeri raporu: aktif ürünlerin güncel maliyet/satış değeri toplamı + kategori bazlı kırılım (`Kategorisiz` dahil); tarih aralığından bağımsız anlık görüntü, aralık seçici bu sekmede gizleniyor
- [x] Muhasebeci paketi: `exceljs` ile tek tıkla ay bazlı Excel (Özet / Satışlar / Giderler / Kasa Hareketleri sayfaları, başlık satırı donmuş) — `/api/raporlar/muhasebeci-paketi?ay=YYYY-MM`; Raporlar sayfası başlığında ay seçici (JS gerektirmeyen native `<form method="GET">`) ile indiriliyor. `xlsx` paketi önce denendi, `npm audit`'te "fix yok" HIGH bulgu (yalnız güvenilmeyen dosya *okurken* tetiklenen, benim kullanımımda erişilemeyen bir kod yolu) çıkınca proaktif olarak `exceljs`'e geçildi
- [x] Kılavuza Raporlar konusu genişletildi: Kârlılık, Stok, Muhasebeci Paketi
- [x] E2E: gerçek kullanıcı oturumuyla — 100 USD maliyetli ürün (güncel kur 47,8066), 2 adet satıldı + 500₺ işçilik kalemi; kârlılık raporu her iki yöntemde de ₺12.500 ciro / ₺9.561,32 maliyet / ₺2.938,68 kâr / %23,5 marjı doğru hesapladı; stok raporu satıştan sonra azalan stok miktarını doğru yansıttı (₺325.084,88 toplam maliyet değeri, kategori kırılımı doğru); Excel export gerçek `fetch` ile indirildi — HTTP 200, doğru `Content-Type`/`Content-Disposition`, dosya `PK\x03\x04` (geçerli xlsx/zip) imzasıyla başlıyor

### Gün 28 — Yönetim Konsolu v1a ✅
- [x] ~~Konsol yüzeyi + `platform_admins` + Master Admin seed~~ → **öne alındı, kullanıcı talebiyle bugün (Gün 9-10 arası) inşa edildi** (bkz. altta).
- [x] **MFA zorunluluğu** (Bölüm 63): Supabase Auth'un yerleşik TOTP/AAL altyapısı üzerine kuruldu — yeni tablo gerekmedi. `/konsol/mfa-kur` (ilk kurulum: QR + gizli anahtar + 6 haneli doğrulama) ve `/konsol/mfa-dogrula` (dönen adminler için AAL1→AAL2 challenge) sayfaları; `(app)/layout.tsx` her istekte `getAuthenticatorAssuranceLevel()` ile AAL2 zorunlu kılıyor, değilse ilgili adıma yönlendiriyor
- [x] **Ayrı kimlik alanı**: Konsol artık tenant panelinden tamamen ayrı bir çerez adı (`sb-konsol`, `src/lib/supabase/konsol-server.ts`/`konsol-client.ts`) kullanan ayrı bir Supabase istemcisiyle çalışıyor — aynı tarayıcıda iki oturum birbirinden habersiz, biri diğerini sonlandırmıyor/etkilemiyor; `/konsol/giris` ayrı giriş sayfası, `middleware.ts` iki çerez alanını ayrı ayrı yönetiyor. **Bilinçli kapsam:** tam anlamda ayrı bir Supabase Auth *projesi* (Bölüm 63'ün "iki kimlik havuzu birbirinden habersizdir" ifadesinin harfiyen karşılığı) kurulmadı — bu yeni bir Supabase projesi + ortam değişkenleri + DNS gerektiren bir altyapı kararı; bugünkü ayrı-çerez + zorunlu-MFA + opsiyonel-IP-kısıtı çözümü günlük kullanımda gerçek izolasyonu sağlıyor
- [x] Opsiyonel IP allowlist: `platform_admins.allowed_ips` (`0032_konsol_mfa_ayri_kimlik.sql`) — doluysa yalnız listedeki IP'lerden erişime izin veriyor
- [x] `tenant_events` temeli (`0033_tenant_events.sql`): olay zaman çizelgesi tablosu + RLS (platform admin herkesi, işletme sahibi/yöneticisi yalnız kendi tenant'ını görebilir — şeffaflık ilkesi) + `admin_tenant_detay()`'e `olaylar` eklendi + tenant detay sayfasında "Olay Zaman Çizelgesi" bölümü. Bu tabloya yazan asıl işlemler (uzatma/askıya alma/plan değişikliği) Gün 29'da eklendi
- [x] E2E: throwaway platform admin (role='support') ile gerçek TOTP algoritmasıyla (RFC 6238, test scripti) uçtan uca doğrulandı — ilk kurulum (QR/gizli anahtar → 6 haneli kod → AAL2), dönen admin doğrulaması (mfa-dogrula), IP kısıtlaması (yanlış IP → red + doğru hata mesajı, temizlenince erişim geri geldi), çıkış, ve **oturum izolasyonu**: konsol oturumuyla `/panel`'e erişilemediği (tenant girişine yönlendirildiği) doğrulandı. **Canlı testte bulunan hata:** İlk yazımda `useEffect`'in cleanup bayrağı (`iptal`) React Strict Mode'un geliştirme modunda mount→cleanup→mount'u senkron simüle etmesiyle çakışıp `enroll()` çağrısına hiç ulaşmadan sayfayı sonsuza dek "Hazırlanıyor…" durumunda bırakıyordu — tek-seferlik yan etkiler için `useRef` bayrağına geçildi, salt-okunur `listFactors()` çağrısında ise `iptal` bayrağı tamamen kaldırıldı (idempotent olduğu için zararsız). Ayrıca `qr_code` alanının bir data-URI değil ham SVG metni döndüğü görüldü, `<img>` için `encodeURIComponent` ile sarmalandı

### Ek — Konsol v0 ✅ (kullanıcı talebiyle öne alındı)
- [x] `0010_konsol_v0.sql`: `platform_admins`, `is_platform_admin()`, `admin_tenant_listesi()`/`admin_tenant_detay()` (SECURITY DEFINER RPC'ler — tenant RLS'i gevşetmeden çapraz-tenant erişim) — uygulandı
- [x] **İlk Master Admin seed edildi: mozkarci1991@gmail.com** (role='master')
- [x] `/konsol`: ayrı üst bar (tenant menüsü yok), istatistik kartları (toplam işletme, son 7 gün yeni, deneme, aktif), arama, tenant tablosu
- [x] `/konsol/[id]`: tenant detayı — bilgiler, kullanıcı listesi, müşteri/cihaz/servis sayaçları
- [x] middleware: `/konsol/**` oturumsuz erişime kapalı; layout `is_platform_admin()` kontrolüyle yetkisiz tenant kullanıcısını `/panel`'e geri yönlendiriyor
- [x] E2E: normal tenant kullanıcısı RPC'yi çağıramıyor (400 "yetkisiz") doğrulandı
- [x] ~~MFA zorunluluğu + tam ayrı kimlik alanı + `tenant_events`~~ → Gün 28'de tamamlandı. ~~Uzatma/askıya alma/plan değişikliği~~ → Gün 29'da. ~~Feature flag yönetim ekranı + admin davet/rol yönetimi~~ → Gün 30'da (hepsi yukarıda) — Konsol v0'ın planladığı tüm genişleme tamamlandı

### Gün 29 — Abonelik Planları + Yönetim Konsolu v1b ✅
Kapsam kullanıcı talebiyle netleştirildi (17.08.2026).

- [x] **Plan kataloğu:** `subscription_plans` (`0034_abonelik_planlari.sql`) —
  Başlangıç (₺499/ay, ₺4.990/yıl, 1 kullanıcı) / Profesyonel (₺899, ₺8.990,
  5 kullanıcı, CRM Plus dahil) / Kurumsal (₺1.499, ₺14.990, sınırsız
  kullanıcı, CRM Plus+WhatsApp/SMS+Kurumsal Satış dahil) — fiyatlar makul
  varsayılan olarak belirlendi (kullanıcı onayıyla, gerekirse sonradan
  değiştirilebilir). Yıllık fiyat ~%17 indirimli (10 aylık bedel)
- [x] `tenants.plan_id`/`billing_cycle` — `handle_new_user()` tetikleyicisi
  her yeni tenant'a varsayılan Başlangıç/aylık atıyor (`0035` — canlı testte
  bulunan bir eksiklik: 0034'teki geriye dönük UPDATE yalnızca o an var olan
  tenant'ları kapsıyordu, yeni kayıtlar plansız kalıyordu, düzeltildi).
  Ayarlar > **Abonelik** bölümü: plan adı/fiyat/dönem, durum rozeti, deneme
  gün sayacı
- [x] Abonelik yaşam döngüsü: Trial → Aktif → Ödeme Bekliyor (past_due) →
  Askıda (suspended) — `tenants.status` zaten bu değerleri destekliyordu
  (Gün 2). `/api/cron/abonelik-kontrol` (günlük, Vercel Cron 03:00 UTC):
  deneme bitmiş tenant'ları `past_due`'a, 7 günlük ek süreyi (grace period)
  aşanları `suspended`'a düşürür, her geçiş `tenant_events`'e yazılır
- [x] **Konsol'dan müdahale:** tenant detayında (rol bazlı görünür/gizli,
  Bölüm 64'teki platform rolleri tablosuna göre):
  - **Süreyi uzat** (master/manager) — yeni bitiş tarihi + zorunlu gerekçe;
    `past_due`/`suspended` durumundaki bir tenant uzatılırsa otomatik
    `trial`'a döner
  - **Durum değiştir** (master/manager) — Askıya Al (gerekçe zorunlu) /
    Yeniden Etkinleştir (tek tık)
  - **Plan değiştir** (master/manager/finance) — plan + dönem (aylık/yıllık)
    + zorunlu gerekçe
  - Her işlem hem `platform_audit_logs`'a (ByteNova tarafı, teknik detay)
    hem `tenant_events`'e (Gün 28'de kurulan, işletme sahibinin de
    görebildiği sade özet) yazılıyor — kasa kapanışı geri almadaki
    şeffaflık deseniyle birebir aynı (Gün 23). **Bilinçli tasarım kararı:**
    roadmap'in "tenant'ın kendi `audit_logs`'una işlenir" ifadesi yerine,
    Gün 28'de bu tam amaç için kurulan `tenant_events` kullanıldı — aynı
    bilgiyi iki ayrı tabloya yazmak gereksiz tekrar olurdu
- [x] **Askıdaki tenant deneyimi:** panel tamamen kilitlenir — layout'ta
  `status==='suspended'` kontrolü, `AbonelikBekliyorEkrani` tam sayfa
  "Aboneliğiniz Beklemede" ekranı (veri silinmez, yalnız erişim durur) +
  gömülü dekont yükleme formu. **Bilinçli kapsam:** roadmap'teki "salt-okunur
  mod" (veriye bakabilme, işlem yapamama) yerine tam kilit tercih edildi —
  her CRUD/RPC'yi tek tek salt-okunur denetlemek bu adımın kapsamını çok
  büyütürdü; tam kilit aynı iş hedefini (ödemesiz kullanım durur) çok daha
  az riskle karşılıyor
- [x] **Manuel ödeme (dekont) akışı:** `payment_receipts` tablosu +
  `dekont_yukle()`/`admin_dekont_onayla()`/`admin_dekont_reddet()` RPC'leri
  (onay/red master/finance rolüne açık). Tenant tarafı: Ayarlar > Abonelik'te
  (deneme veya ödeme bekleyen durumda) dosya yükleme formu, `servis-belgeleri`
  bucket'ının mevcut tenant-scoped RLS deseni yeniden kullanıldı
  (`{tenant_id}/dekont/...`). Konsol tarafı: `/api/konsol/dekont/[id]`
  route'u service-role ile imzalı URL üretip dekontu gösteriyor, onay/red
  butonları + red gerekçesi alanı. Onaylanınca tenant `active`'e dönüyor
- [x] **Canlı testte bulunan güvenlik hatası (deploy öncesi yakalandı):** ilk
  yazımda platform admin rol kontrolleri `select role into v_rol from
  platform_admins ...; if v_rol not in (...)` şeklindeydi — PL/pgSQL'de
  NULL bir IF koşulunda "false" gibi davranır (hata fırlatmaz), yani
  platform_admins'te hiç kaydı olmayan (sıradan bir tenant kullanıcısı gibi)
  biri bu RPC'leri çağırırsa yetki kontrolü sessizce ATLANIYORDU. Tüm 5 yeni
  RPC, `0023`'teki kanıtlanmış `if not exists (select 1 from platform_admins
  where id = auth.uid() and role in (...))` desenine geçirilerek düzeltildi

> Not: Otomatik/online tahsilat (kart ile aylık/yıllık otomatik çekim,
> `BillingProvider` soyutlaması) bu güne dahil değil — Sprint 9-12,
> madde 4'te ayrı bir iş olarak planlı; Gün 29 yalnızca planların
> tanımını ve manuel/idari yönetimini kapsar.

- [x] E2E: throwaway master-rol admin + throwaway destek-rol admin +
  throwaway tenant ile gerçek tarayıcı oturumunda uçtan uca doğrulandı —
  tenant kaydı doğru varsayılan planı aldı; gerçek RPC+storage ile dekont
  yüklendi, konsoldan onaylandı → tenant `Aktif`'e döndü ve olay zaman
  çizelgesine düştü; Askıya Al → tenant panelinde tam kilit ekranı doğrulandı
  → Yeniden Etkinleştir → panel erişimi geri geldi; Süreyi Uzat ve Plan
  Değiştir (Başlangıç→Profesyonel, yıllık) doğru işlendi; **destek rolündeki
  admin** için uzatma/durum/plan panellerinin tamamen gizlendiği (yalnız
  salt-okunur bilgi + dekont görüntüleme kaldığı) doğrulandı; cron endpoint'i
  gerçek CRON_SECRET ile çağrılarak hem `trial→past_due` hem
  `past_due→suspended` (7 günlük grace period aşımı) otomatik geçişleri ve
  ilgili `tenant_events` kayıtları doğrulandı. Test verileri temizlendi

### Gün 30 — Sertleştirme ✅
- [x] **RLS güvenlik taraması** (`0036_sertlestirme_rls_taramasi.sql`): `pg_tables`/`pg_policies` introspection'ıyla tüm 49 public tablo tarandı. **Gerçek bir açık bulundu:** `sale_no_counters`/`service_no_counters`/`return_no_counters`/`purchase_no_counters` (belge numarası sayaçları) tablolarında RLS TAMAMEN KAPALIYDI — herhangi bir giriş yapmış kullanıcı PostgREST üzerinden başka tenant'ların sayaçlarını görebilir, hatta `last_no`'yu doğrudan UPDATE ederek belge numarası çakışması yaratabilirdi. Dört tabloya da tenant-scoped SELECT RLS'i eklendi (yazma zaten yalnız SECURITY DEFINER sayaç fonksiyonlarından). Ayrıca tüm INSERT/ALL politikalarının `with_check` içerdiği ve `qual`'i `current_tenant_id()`/`is_platform_admin()`/`auth.uid()` dışında bir şeye dayanan politika olmadığı doğrulandı
- [x] **Performans geçişi** (`0037_performans_tenant_index.sql`): `tenant_id` sütunu olup onu kapsayan hiçbir index'i olmayan 14 tablo bulundu (çoğu zaten doğal bir üst-kayıt index'ine sahip, ama RLS'in `tenant_id = current_tenant_id()` filtresi index'siz kalıyordu) — hepsine index eklendi
- [x] **Admin davet/rol yönetimi** (`0038_konsol_admin_yonetimi.sql`): `platform_admin_invitations` + davet oluştur/iptal RPC'leri (yalnız Master). Ayrı bir "davet kabul" formu kurmak yerine mevcut giriş akışına entegre edildi: davetli mevcut/yeni bir Supabase Auth hesabıyla `/konsol/giris`'e girdiğinde bekleyen davet varsa otomatik kabul edilir (`platform_davet_kabul_et()`). Rol değiştirme/kaldırma RPC'leri "son Master Admin düşürülemez/kaldırılamaz" kuralını uyguluyor. Yeni `/konsol/adminler` sayfası — Master için tam yönetim, diğer roller için salt-okunur
- [x] **Feature flag yönetim ekranı:** `admin_flag_ayarla()` (master/manager) + yeni `/konsol/ayarlar` sayfası — `menu.ts`'teki tüm modüller için global durum (Kapalı/Çok Yakında/Beta/Aktif) tek ekrandan değiştirilebiliyor. **Bilinçli kapsam dışı:** tenant/yüzde bazlı kademeli açılış — P2
- [x] **Konsol'da paket toggle ekranı:** `admin_paket_durumu_degistir()` (master/manager) — aynı `/konsol/ayarlar` sayfasında ikinci bölüm, `addon_packages.status`'u (Taslak/Satışta/Kaldırıldı) değiştiriyor; "Taslak" işaretlenen paket tenant'ların Ayarlar &gt; Eklentiler kataloğunda anında kayboluyor (mevcut sorgu zaten yalnız `status='available'` çekiyordu — Gün 8'den beri hazır bekleyen bir kanca kullanıldı)
- [x] **E2E test paketi:** bu üç Gün 30 özelliği throwaway master admin + gerçek e-posta/parola akışıyla uçtan uca doğrulandı — davet oluşturuldu → davetlinin hesabı açılıp `/konsol/giris`'te otomatik kabul edildi (MFA kurulumuna yönlendirildi) → Adminler listesinde doğru rolle göründü; rol değiştirme ve kaldırma doğrulandı (yalnız test hesapları üzerinde — gerçek Master Admin hesabına hiç dokunulmadı); bekleyen davet iptali doğrulandı; feature flag ve eklenti paketi durumu değiştirilip veritabanından doğrulandı ve hemen eski değerine geri alındı (canlı tenant'ları etkilememesi için). **Bilinçli kapsam:** "son Master Admin kaldırılamaz" kuralının engelleme dalı canlı ortamda test edilmedi — gerçek Master Admin hesabını (mozkarci1991@gmail.com) geçici de olsa düşürmek/kaldırmak gerekirdi, bu risk alınmadı; kural kod incelemesiyle ve `0023`'teki kanıtlanmış aynı desenle doğrulandı. S1/S2/S3'ün tam bir regresyon turu da bugüne dahil edilmedi — bugünün değişiklikleri yalnız `middleware.ts`/`panel/layout.tsx`'e dokundu ve bu ikisi zaten Gün 28-29 E2E'lerinde defalarca (aktif tenant panel yüklemesi) doğrulandı

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

Sıra pilot geri bildirimiyle revize edilir. **Kapsam notu (17.08.2026):** masaüstü/Tauri
uygulaması ve AI asistan kullanıcı talebiyle kapsam dışı bırakıldı; pilot başlangıcı
gerçek dış kullanıcı gerektirdiği için inşa edilemez — atlandı.

- [x] **Showroom tam sürüm** ✅ (modül turu, fiyatlandırma, SSS, canlı demo, SEO) — ayrıntılar aşağıda
- [x] **Excel import sihirbazı** ✅ (müşteri/ürün/stok/cihaz/açık servis) — ayrıntılar aşağıda
- [x] **Servis derinliği** ✅ (`0039_servis_derinligi.sql`): teslim alınmayan cihaz
  otomasyonu, ücretli teşhis, servis garantisi ilişkisi, kanban görünümü, azami süre
  sayacı — tümü tamamlandı, ayrıntılar aşağıda
- [x] **Teklif modülü + PDF** ✅ (`0040_teklif_modulu.sql`) — ayrıntılar aşağıda
- [x] **Dijital ürün (lisans key)** ✅ + demo veri seti (Showroom canlı demo ile birleştirildi) — ayrıntılar aşağıda
- [x] **Kurulum sihirbazı tam sürüm** ✅ + onboarding dokümanları — ayrıntılar aşağıda
- [x] ~~2-3 gerçek bilgisayarcıyla pilot başlangıcı~~ → **kapsam dışı** (gerçek dış kullanıcı gerektirir)

### Servis Derinliği — ayrıntılar ✅
- [x] **Kanban görünümü:** `/panel/servisler?gorunum=kanban` — 18 ham durumu 6 okunabilir
  sütuna gruplar (Kabul/İnceleme, Fiyat/Onay Bekliyor, Onarımda, Test/Hazır, Teslim
  Alınmadı, Kapandı); karttan tek tıkla durum değişimi (`ServisKanban.tsx`)
- [x] **Ücretli teşhis** (Bölüm 12.10): `servis_teshis_ucreti_uygula()` RPC — müşteri
  teklifi reddederse ücret kaydedilir, cihaz "Hazır" durumuna geçer, sistem notu düşer;
  tahsilat mevcut `servis_tahsilat_al()` akışıyla (Gün 18) yapılır, yeni ödeme mekanizması
  gerekmedi
- [x] **Servis garantisi ve tekrar servis** (Bölüm 12.9): Gün 7'den beri var olup hiç
  kullanılmayan `source_service_id` sütunu artık gerçek bir akışa bağlandı — kapanmış bir
  servisten "🛡️ Garanti Kapsamında Tekrar Servis Aç" ile yeni kayıt açılır (müşteri/cihaz
  otomatik dolar), iki kayıt karşılıklı bağlantı gösterir. **Azami tamir süresi (20 iş
  günü)** sayacı istemci tarafında hesaplanır (`isGunuSayisi()` — hafta sonu hariç), 15
  günde turuncu, 20 günde kırmızı rozet
- [x] **Teslim alınmayan cihaz otomasyonu** (Bölüm 12.7): `/api/cron/servis-teslim-kontrolu`
  (günlük) — "Hazır" durumunda tenant başına ayarlanabilir süre (varsayılan 15 gün, Ayarlar
  > Servis Ayarları) geçen cihazları otomatik "Teslim Alınmadı"ya düşürür + sistem notu;
  Genel Bakış'a "Teslim Alınmayanlar" kartı eklendi. **Bilinçli kapsam dışı:** gerçek
  SMS/arama/ihtar kademeli hatırlatma zinciri (gün 15/30/60) bir mesajlaşma sağlayıcısı
  gerektirir — Sprint 9-12'deki WhatsApp/SMS eklentisine planlı; bugün yalnız durum geçişi
  ve panel içi görünürlük otomatik
- [x] E2E: throwaway tenant + müşteri + cihazla uçtan uca doğrulandı — servis oluşturuldu,
  kanban görünümünde kart doğru sütuna düştü ve durum değişimi anında yansıdı; ücretli
  teşhis uygulandı (₺300 rozet + durum "Hazır"a geçti); teslimde 90 günlük varsayılan
  garanti süresi doğru kaydedildi; kapanmış servisten garanti kapsamında tekrar servis
  açıldı, her iki kayıtta da karşılıklı bağlantı ve "0/20 iş günü" sayaç rozeti doğru
  göründü; cron endpoint'i gerçek CRON_SECRET ile tetiklenerek "Hazır" durumundaki bir
  servisin (geçmişe atılmış durum kaydıyla simüle edilen 20 gün sonra) otomatik "Teslim
  Alınmadı"ya düştüğü ve Genel Bakış'taki sayaca yansıdığı doğrulandı; Ayarlar > Servis
  Ayarları kaydı doğrulandı. **Canlı testte bulunan hata:** Kanban bileşenine bir server
  component'ten doğrudan fonksiyon (`teknisyenAdi` closure'ı) prop olarak geçiriliyordu —
  Next.js Server/Client Component sınırında fonksiyonlar serileştirilemediği için sayfa
  runtime hatasıyla çöküyordu (build zamanında yakalanmadı, yalnız tarayıcıda ortaya çıktı);
  düzeltme: ham `kullanicilar` dizisi client component'e geçirilip ad sözlüğü orada
  hesaplanacak şekilde değiştirildi

### Teklif Modülü — ayrıntılar ✅
- [x] `quotes`/`quote_items`/`quote_no_counters` (`TK-YYYY-NNNNNN` sayaç deseni,
  `sale_no_counters`/`sonraki_satis_no()` ile birebir aynı) + `teklif_olustur()` RPC'si —
  `satis_olustur()`'un (Gün 16) aynısı desen: ürün/işçilik/hizmet kalemleri, satır +
  genel iskonto, dövizli teklif (kur oluşturma anında donar, `exchange_rate` sütununda
  saklanır)
- [x] Yaşam döngüsü: Taslak → Gönderildi → Müşteri İnceliyor → Kabul/Reddedildi/Süresi
  Doldu — `menu.ts`'teki "teklifler" durumu `yakinda`→`aktif` (Gün 8'den beri hazır
  bekleyen `kurumsal_satis` addon kancasına takılı, `EklentilerListesi`/`efektifMenu()`
  hiç değişmeden aynen çalıştı)
- [x] **PDF + QR online onay:** `TeklifBelgesi.tsx` (`@react-pdf/renderer`, Gün 10/24'teki
  aynı görsel dil) + `teklifPdfOlustur()` + `/api/teklif/[id]/pdf`. QR kod, herkese açık
  `/teklif-onay/[token]` sayfasına (oturumsuz, `teklif_detay_al()`/`teklif_goruntulendi()`/
  `teklif_musteri_karari()` — token'ın kendisi yetkilendirme, RLS'i SECURITY DEFINER ile
  bilinçli atlıyor) yönlendirir; sayfa ilk açıldığında durum otomatik "Müşteri İnceliyor"a
  geçer, müşteri Kabul/Reddet seçebilir. Personel de aynı kararı (telefon/yüz yüze onay
  için) panelden manuel işleyebilir
- [x] **Satışa dönüştürme:** `teklif_satisa_donustur()` — kabul edilen teklifin
  kalemlerini `satis_olustur()`'a (Gün 16) AÇIK HESAP ödemesiyle devrederek gerçek bir
  satış yaratır (stok düşümü, müşteri borcu, audit dahil hiçbir mantık tekrar yazılmadı);
  teklif o satışa bağlanır, ikinci kez dönüştürme engellenir
- [x] **Canlı testte bulunan güvenlik/doğruluk hatası (deploy öncesi yakalandı):**
  `teklif_musteri_karari()` içinde `audit_ekle()` çağrılıyordu — o fonksiyon
  `current_tenant_id()`'ye (yani `auth.uid()` ile eşlenen bir `profiles` satırına) dayanır;
  bu RPC anonim bir müşteri tarafından (hiç oturumsuz, yalnız token ile) çağrıldığında
  `auth.uid()` null olur, `audit_logs.tenant_id` NOT NULL kısıtına takılıp TÜM işlem geri
  alınırdı — yani müşterinin onayı sessizce başarısız olurdu. Düzeltme: `audit_logs`'a
  teklifin kendi `tenant_id`'siyle doğrudan, `audit_ekle()` kullanmadan yazılıyor
- [x] E2E: throwaway tenant'a `kurumsal_satis` addon'u aktif edilip uçtan uca doğrulandı —
  ürün + işçilik kalemli iki teklif oluşturuldu; PDF gerçek `fetch` ile indirildi (`%PDF-`
  imzası, 200 OK); ilk teklif gönderildi → **tamamen ayrı bir tarayıcı sekmesinde,
  oturumsuz** `/teklif-onay/[token]` sayfası açıldı → görüntülemede durum otomatik
  "Müşteri İnceliyor"a geçti (veritabanından doğrulandı) → "Kabul Ediyorum" → panelde
  "Kabul Edildi" olarak yansıdı → "Satışa Dönüştür" → gerçek bir satış (`SN-2026-000001`)
  oluştu, ürün stoğu 50→49 düştü, müşteri açık hesap bakiyesi ₺1.000 arttı; ikinci teklif
  personel tarafından panelden manuel "Müşteri Reddetti" ile (gerekçe notuyla) reddedildi;
  Teklifler liste sayfasında her iki kayıt da doğru durum/tutarla göründü

### Kurulum Sihirbazı Tam Sürüm — ayrıntılar ✅
- [x] **6 adımlı sihirbaz** (`KurulumSihirbazi.tsx`, `/kurulum`): İşletme Bilgileri (ad/telefon/
  adres/logo, eski v0 formunun aynısı) → Şube (varsayılan "Merkez" şubesini yeniden adlandırma)
  → Kasa Hesabı (ilk nakit/banka/POS hesabı — zaten varsa adım otomatik "zaten var" mesajıyla
  atlanır) → Ürün Kategorileri (isteğe bağlı, birkaç başlangıç kategorisi) → İlk Ürünler
  (Excel içe aktarma sihirbazına veya elle ekleme formuna yönlendiren iki kart) → Tamamlandı
  (özet + Yeni Müşteri/Yeni Satış/Kullanıcı Davet/Kılavuz kısayolları). Her adım "Devam Et"e
  basılınca hemen kaydedilir (aşamalı kayıt — `ImportSihirbazi`/`UrunFormu` ile aynı disiplin),
  `onboarding_completed` yalnız son adımda `true` olur. Her adımda "Şimdilik atla, panele git"
  kaçış kapısı vardır — kimse sihirbazda hapsolmaz
- [x] **Bölüm 62 spesifikasyonuyla bilinçli fark:** orijinal 10 adımlı taslak (İşletme, Şube,
  Vergi/e-belge tercihleri, Kullanıcılar, **Servis kategorileri**, Ürün kategorileri, Ödeme
  yöntemleri, **Yazıcı/barkod ayarları**, İlk stok, Tamamlandı) erken/vizyoner bir belgeden
  geliyor — bugünkü şemada "servis kategorileri" diye bir kavram yok (servisler durum/öncelik
  ile sınıflanıyor, ayrı bir kategori tablosu hiç kurulmadı) ve "yazıcı/barkod ayarları" diye
  bir modül de yok (barkod okuyucular klavye girişi gibi çalışıyor, sıfır kurulum gerektiriyor;
  yazdırma tarayıcının kendi yazdır işlevi). Sahte bir ayar ekranı icat etmek yerine bu iki
  adım bilinçli olarak atlandı; "Vergi/e-belge tercihleri" ve "Kullanıcılar" ayrı birer adım
  olmak yerine sırasıyla ürün formundaki KDV alanına (zaten var) ve son adımdaki "Ekip
  arkadaşlarınızı davet edin" kısayoluna birleştirildi — mevcut Ayarlar > Kullanıcılar akışını
  tekrar yazmak yerine ona yönlendiriyor
- [x] **Onboarding dokümanları:** panel içi Kılavuz'daki mevcut "Hızlı Başlangıç" konusu
  (`src/lib/kilavuz.ts`), eski tek adımlı kurulumu anlatan bir bölüm içeriyordu — yeni 6 adımlı
  sihirbazı adım adım anlatacak şekilde güncellendi
- [x] E2E: throwaway kullanıcı ile — kayıttan hemen sonra `/kurulum`'a otomatik yönlendirildiği
  doğrulandı; altı adımın tamamı sırayla dolduruldu (işletme adı, şube adı, ilk kasa hesabı,
  bir kategori, "İlk Ürünler" bilgi ekranı) ve "Panele Git"e basılınca panelin boş ama çalışır
  durumda açıldığı, üst çubukta doğru işletme adının göründüğü doğrulandı; veritabanında
  `tenants.onboarding_completed=true`, şube adı, tam olarak 1 kasa hesabı ve 1 ürün kategorisi
  oluştuğu doğrulandı; test verileri (tenant + kullanıcı, cascade ile) temizlendi

### Showroom Tam Sürüm — ayrıntılar ✅
- [x] **Ortak header/footer** (`ShowroomHeader.tsx`/`ShowroomFooter.tsx`) — ana sayfa dahil tüm
  Showroom sayfalarında tekrar kullanılıyor, oturum durumuna göre Giriş/Kayıt ↔ "Panele Git"
- [x] **Modül turu** (`/moduller`): `menu.ts`'teki `PANEL_MENU` tek kaynağından beslenir (yeni
  bir kopya veri yazılmadı) — 12 aktif modül + 5 yol haritası modülü, eklenti rozetleriyle
- [x] **Fiyatlandırma** (`/fiyatlandirma`): `subscription_plans`/`addon_packages`'tan **canlı**
  çekiliyor (statik kopya değil) — Konsol'dan bir fiyat değişse Showroom'a da otomatik yansır.
  Bunun için `0041_showroom_anonim_fiyatlandirma.sql` ile bu iki tabloya yalnızca
  aktif/satıştaki satırları gösteren `anon` rolüne özel SELECT politikası eklendi (tablolarda
  hassas veri yok — yalnız ad/fiyat/özellik)
- [x] **SSS** (`/sss`): panel içi kılavuzdaki "sss" konusundan farklı, satış öncesi sorulara
  odaklı ayrı bir soru seti (deneme, veri aktarımı, güvenlik, iptal); `FAQPage` JSON-LD
  şeması eklendi (SEO — arama sonucunda katlanır soru/cevap görünümü)
- [x] **Canlı demo** (`/demo`): kayıt olmadan, gerçek verilerle doldurulmuş paylaşımlı bir
  demo hesabına giriş. **Bilinçli tasarım kararı:** demo tenant salt-okunur değil, tamamen
  yazılabilir bırakıldı — ziyaretçi panelde gerçekten işlem yapabilsin diye. Kötüye kullanım
  riski `tenant_id` RLS izolasyonu sayesinde yalnızca bu tek (sahte) tenant'ın kendi verisiyle
  sınırlı kalır, başka hiçbir gerçek işletmeyi etkilemez; `/api/cron/demo-sifirla` (her gece
  05:00 UTC, `vercel.json`) demo tenant'ını tamamen silip (`tenants` üzerindeki tüm FK'lar
  `ON DELETE CASCADE`) baştan örnek veriyle dolduruyor. Panelde `PanelKabuk`'a eklenen
  turuncu şerit ("verileriniz her gece sıfırlanır") ziyaretçiyi bilgilendiriyor
  (`tenants.is_demo`, `0042_demo_tenant.sql`)
- [x] **Demo veri seti** (`src/lib/demo.ts`, `demoTenantiSifirlaVeDoldur()`): 8 ürün, 4 müşteri
  (1 kurumsal), 3 cihaz, kanban'ın 3 farklı sütununa düşecek 3 servis kaydı, gerçek
  `satis_olustur()`/`teklif_olustur()` RPC'leriyle oluşturulmuş 1 satış + 1 teklif. **Canlı
  testte bulunan hata:** bu RPC'ler `auth.uid()` üzerinden yetki/tenant çözdüğü için
  service-role istemciyle çağrıldıklarında sessizce "yetkiniz yok" hatası veriyordu —
  düzeltme: demo kullanıcısıyla gerçek bir oturum açılıp RPC'ler o oturumun access token'ıyla
  çağrılıyor. **İkinci hata (E2E'de bulundu):** `supabase.auth.admin.createUser()` çağrısı
  `handle_new_user()` tetikleyicisini fırlatıp kendi (boş, `is_demo=false`) tenant/profile
  ikilisini otomatik yaratıyor; script bunun üstüne ikinci bir profil satırı eklemeye
  çalışınca birincil anahtar çakışmasıyla sessizce başarısız oluyor, demo kullanıcısı asıl
  doldurulan (ama profile hiç bağlı olmayan) tenant'tan kopuk kalıyordu. Düzeltme: her
  sıfırlamada önce kullanıcının **o an profildeki** `tenant_id`'si siliniyor (tetikleyicinin
  mi yoksa önceki sıfırlamanın mı yarattığı fark etmeksizin), ayrıca `is_demo=true` işaretli
  başıboş bir tenant kalmaması için ek bir güvenlik silmesi de ekli
- [x] **SEO:** `sitemap.ts`/`robots.ts` eklendi; ana sayfaya ve yeni sayfaların hepsine
  `export const metadata` (başlık/açıklama) eklendi; ana sayfadaki eski "İnşa halinde" rozeti
  ürün artık canlı olduğu için "Şimdi canlıda" olarak güncellendi, ana sayfadan
  Modüller/Fiyatlandırma/Demo'ya yönlendiren üç kart eklendi
- [x] E2E: `/api/cron/demo-sifirla` gerçek `CRON_SECRET` ile üç kez art arda tetiklenerek
  idempotent olduğu doğrulandı (her seferinde tam olarak tek bir `is_demo=true` tenant kalıyor,
  veri sayıları sabit: 8 ürün/4 müşteri/3 cihaz/3 servis/1 satış/1 teklif); tarayıcıda gerçek
  "Demoyu Başlat" akışı denendi — girişten sonra panelde turuncu demo şeridi, Genel Bakış'ta
  doğru rakamlar (₺4.100 satış, 3 açık servis, 1 kritik stok), kanban'da üç kartın doğru
  sütunlarda, Teklifler listesinde ₺28.500 tutarlı teklifin doğru göründüğü doğrulandı;
  `/fiyatlandirma` sayfasının canlı DB'den doğru üç planı ve dokuz eklentiyi anonim
  (oturumsuz) tarayıcı bağlamında çektiği doğrulandı

### Dijital Ürün (Lisans Key) — ayrıntılar ✅
- [x] **Şema** (`0043_dijital_urun_lisans.sql`): `products.is_digital`; yeni
  `product_license_keys` tablosu (`musait`/`satildi`/`iptal` durumları, `tenant_id +
  product_id + key_value` üzerinde unique) — spesifikasyondaki ("Stok adedi yerine key
  havuzu"; `docs/ByteNova_PROJE_DOSYASI_v2.md`) birebir karşılığı. `sale_items` tablosuna
  `assigned_license_keys text[]` eklendi
- [x] **`satis_olustur()` RPC'sinin genişletilmesi:** İmza değişmedi, düz `create or replace`
  güvenli. Dijital bir ürün satıldığında normal stok hareketi (`stok_hareketi_ekle`) YERİNE
  miktar kadar "müsait" anahtar `FOR UPDATE SKIP LOCKED` ile kilitlenip "satıldı"ya çevrilir
  ve satış kalemine yazılır — eşzamanlı iki kasiyer aynı anahtarı asla iki kez satamaz.
  Yetersiz anahtar varsa `LISANS_ANAHTARI_YETERSIZ` hatasıyla işlem tamamen geri alınır
  (`STOK_YETERSIZ` ailesiyle aynı desende, Hızlı Satış ekranında okunabilir mesaja çevrilir)
- [x] **Toplu anahtar ekleme/iptal RPC'leri:** `lisans_anahtari_toplu_ekle()` (satır satır
  yapıştırma, yinelenenler `on conflict do nothing` ile sessizce atlanır ve kaç tanesinin
  atlandığı arayüzde raporlanır), `lisans_anahtari_iptal()` (yalnız "müsait" durumundaki
  hatalı girişler için — satılmış bir anahtar iptal edilemez)
- [x] **Arayüz:** Ürün formunda "🔑 Dijital Ürün" seçeneği (oluşturduktan sonra
  değiştirilemez — Min. Stok/Seri No/Garanti alanları bu modda gizlenir, "Kritik Stok"
  "Kritik Anahtar Sayısı"na dönüşür); yeni `/panel/stok/[id]/lisans-anahtarlari` yönetim
  sayfası (havuz özeti, toplu ekleme, anahtar listesi + kime/hangi satışa gittiği, iptal);
  Stok listesi ve ürün detayında 🔑 rozeti ve gerçek müsait-anahtar sayısı (stock_quantity
  değil); Hızlı Satış arama sonucunda "Stok: N" yerine "🔑 Dijital" etiketi; satış
  detayında atanan anahtar(lar) mor rozetle görünür. **Bilinçli kapsam dışı:** dijital
  kalemler için iade akışı (kullanılmış bir anahtarın "iade"si farklı bir iş kuralı
  gerektirir — normal `IadeBaslat` bu kalemlerde gizlendi); e-posta ile anahtar gönderimi
  (SMTP entegrasyonu henüz yok, "belgeye yazılır" kısmı satış detay sayfası/gelecekteki
  satış PDF'i ile karşılanıyor); Alış/Sayım/Raporlar akışları dijital ürünleri henüz özel
  olarak ele almıyor (fiziksel ürün gibi davranıyorlar — Genel Bakış'taki kritik stok
  kartı hariç, o düzeltildi)
- [x] **Canlı testte bulunan hata (PostgREST'in heterojen anahtarlı toplu insert davranışı):**
  Demo tohumlama script'inde tek bir `.insert([...])` çağrısına hem dijital hem fiziksel
  ürünler karışık veriliyordu; PostgREST bir dizideki satırların HEPSİNİ aynı sütun
  kümesiyle SQL'e çevirir — bir satırda eksik olan alan (`is_digital`) diğer satırlarda
  varsa, o satır için sütun VARSAYILANI uygulanmaz, açıkça `NULL` gönderilir. `is_digital
  not null default false` olduğundan bu, "null value in column is_digital violates not-null
  constraint" hatasıyla TÜM satışların (ve dolayısıyla dokuz ürünün tamamının) sessizce
  eklenmemesine yol açtı. Düzeltme: dizideki her satıra `is_digital` alanı açıkça eklendi;
  ayrıca bu script'teki ürün ekleme çağrısına hiç hata kontrolü yoktu (`{ data }` yalnızca
  destructure ediliyordu) — artık hata varsa fırlatılıyor, aynı sınıf sorun bir daha sessiz
  kalmayacak
- [x] E2E: gerçek Showroom demo hesabıyla (bkz. aşağıdaki Showroom bölümü) uçtan uca
  doğrulandı — "Windows 11 Pro Dijital Lisans" ürünü Hızlı Satış'ta arandı, sepete
  eklendiğinde "🔑 Dijital" etiketiyle doğru göründü, satış tamamlandığında müsait 3
  anahtardan biri (`DEMO1-WIN11-...`) otomatik rezerve edildi ve satış detay sayfasında
  mor rozetle doğru göründü; veritabanında o anahtarın durumu "satıldı" ve doğru `sale_id`
  ile işaretlendiği doğrulandı, kalan 2 anahtar "müsait" kaldı; Stok listesinde ürün 🔑
  rozetiyle ve doğru (2) müsait sayısıyla göründü; `/panel/stok/[id]/lisans-anahtarlari`
  sayfasında toplu anahtar ekleme (2 yeni + 1 kasıtlı yinelenen, "1 tanesi zaten kayıtlıydı"
  doğru raporlandı) ve "İptal et" (müsait bir anahtarı iptal durumuna düşürme) doğrulandı;
  gerçek ürün formu üzerinden sıfırdan yeni bir dijital ürün oluşturuldu ("Office 365 Kişisel
  Lisans") — formun Min. Stok/Seri No/Garanti alanlarını gizlediği, "Kritik Anahtar Sayısı"
  etiketine döndüğü ve kaydedilince ürün detay sayfasının "0 müsait anahtar" ile doğru
  göründüğü doğrulandı; test verileri temizlendi

### Excel Import Sihirbazı — ayrıntılar ✅
- [x] **4 adımlı sihirbaz** (`ImportSihirbazi.tsx`, `/panel/import?tur=...`): 1) tür seçimi +
  dosya yükleme, 2) sütun eşleme (isim benzerliğine göre otomatik ön-eşleme, elle
  düzeltilebilir), 3) ilk 5 satır önizleme, 4) sonuç — satır bazlı başarı/hata listesi.
  Müşteriler ve Stok sayfalarına "📥 İçe Aktar" kısayolu eklendi (tür önceden seçili gelir),
  Ayarlar'a genel giriş kartı eklendi (yalnız `ayar_yonet` yetkisi olanlara)
- [x] **Sunucu tarafı ayrıştırma:** `/api/import/parse` — `exceljs` ile `.xlsx` okunur (proje
  zaten Gün 27'den beri bu paketi kullanıyor), ilk satır başlık kabul edilir, en fazla 5 MB /
  2000 satır sınırı. `/api/import/calistir` — türe göre (müşteri/ürün/cihaz/servis) satır satır
  doğrulayıp `tenant_id` ile ekler, her satır için ayrı ok/hata sonucu döner (tek satırın
  hatası diğerlerini engellemez)
- [x] **İlişkisel eşleme:** cihaz ve açık-servis türleri müşteriyi telefon numarasıyla arar
  (`Telefon ile eşleşen müşteri bulunamadı` hatası), cihaz türü `GECERLI_CIHAZ_TURLERI`
  listesine karşı doğrulanır (`Geçersiz cihaz türü` hatası); açık servis türü ayrıca seri
  numarasıyla isteğe bağlı cihaz eşlemesi yapar
- [x] E2E: throwaway tenant ile — 3 satırlık müşteri dosyası (2 geçerli + 1 kasıtlı boş-ad
  satırı) `/api/import/parse`den doğru `columns`/`rows` ile döndü, `/api/import/calistir`
  ile 2 başarılı + 1 "Ad zorunlu" hatası doğru raporlandı, veritabanında tam 2 müşteri
  satırı doğrulandı; ardından 4 satırlık cihaz dosyası (2 geçerli, 1 eşleşmeyen telefon,
  1 geçersiz cihaz türü) aynı şekilde doğru sonuçlandı ve iki cihaz doğru müşterilere
  bağlı olarak veritabanında doğrulandı. `<input type=file>` tarayıcı otomasyonuyla
  sürülemediği için gerçek `.xlsx` dosyaları Node/`exceljs` ile üretilip `public/` altına
  geçici olarak konup tarayıcı içinden `fetch()`+`FormData` ile yüklendi, test sonunda
  dosyalar ve throwaway tenant/kullanıcı silindi. "urun" ve "servis" türleri aynı kod
  desenini birebir izlediği için yalnız kod incelemesiyle doğrulandı (tam E2E yapılmadı)

**Sprint sonu:** 🎯 **Sprint 7-8 tamamlandı** — Showroom gerçek fiyat/modül verisiyle canlı,
kayıt olmadan denenebilen bir demo hesabı var; işletmeler artık kendi eski sistemlerinden veri
taşıyabiliyor (Excel import), dijital lisans satabiliyor ve 6 adımlı bir sihirbazla kuruluma
başlıyor. Pilot başlangıcı hariç (gerçek dış kullanıcı gerektirir) sprintin tüm maddeleri bitti.

## SPRINT 9-12 — P1 MODÜLLERİ (Hafta 7-12)

Öngörülen öncelik (pilot verisiyle güncellenir):

- [x] **WhatsApp/SMS + İYS** ✅ — sağlayıcı soyutlaması, servis bildirimleri, İYS onayı — ayrıntılar aşağıda
- [ ] **e-Belge** — entegratör soyutlaması + ilk entegratör, gider pusulası, portal modu
- [ ] **Çek/Senet + POS mutabakat** — portföy, vade takvimi, nakit akış uyarıları
- [ ] **Otomatik abonelik tahsilatı** — `BillingProvider` (iyzico/PayTR), dunning, impersonation
  - **Eklenti self-servis switch'i** aynı işte: tenant panelinde Ayarlar → Eklentiler, otomatik ödeme + kullanım bazlı faturalama (`docs/EKLENTI_MIMARISI.md`). İlk paketler: WhatsApp/SMS ve e-Belge.
- [ ] **PC Toplama (BOM)** — reçete, toplama emri, demontaj
- [ ] **Toptancı XML** — ilk 2-3 distribütör adaptörü
- [ ] **Müşteri servis takip sayfası** (QR) + bakım sözleşmeleri + prim + uyumluluk matrisi + ÖKC entegrasyonu

### WhatsApp/SMS + İYS — ayrıntılar ✅
- [x] **Sağlayıcı soyutlaması** (`src/lib/bildirim.ts`): gerçek bir WhatsApp Business API/SMS ağ
  geçidi kimlik bilgisi bu ortamda yok — `sandboxGonder()` her zaman başarılı döner ve hiçbir
  dış API çağırmaz. Bilinçli tasarım: şema/kuyruk/tetikleyici mimarisi gerçek üretim mimarisiyle
  birebir aynı kurulur, yalnızca gönderim adımı mock'lanır — gerçek sağlayıcıya geçiş yalnızca
  bu tek fonksiyonu değiştirmeyi gerektirir
- [x] **Kuyruk + işleyici mimarisi** (`0044_bildirimler_whatsapp_sms.sql`): `notification_log`
  tablosu (`beklemede`/`gonderildi`/`basarisiz`), `/api/cron/bildirim-gonder` (her 10 dakikada,
  `vercel.json`) kuyruktaki kayıtları işler — sandbox'ta anında başarılı, gerçek sağlayıcıda
  webhook'la asenkron güncellenebilecek şekilde tasarlandı
- [x] **Otomatik tetikleyici — servis hazır:** `service_orders.status` "hazir"a her geçtiğinde
  (`servis_hazir_bildirimi_kuyrukla()` trigger'ı) — whatsapp_sms eklentisi aktifse ve müşterinin
  telefonu kayıtlıysa — otomatik bir bildirim kuyruğa eklenir; hiçbir UI değişikliği gerekmedi
  (kanban, servis detayı, hangi ekrandan durum değiştirilirse değiştirilsin tetiklenir)
- [x] **Manuel gönderim + İYS onayı:** `bildirim_gonder()` RPC'si (`/panel/bildirimler`) —
  "işlemsel" şablonlar (servis hazır, ödeme hatırlatma) her zaman gönderilebilir; "pazarlama"
  şablonları (kampanya/duyuru) yalnız `customers.marketing_consent = true` olan müşterilere
  gönderilebilir — İYS (İleti Yönetim Sistemi) uyumluluğu için. Kontrol hem istemci tarafında
  (anında geri bildirim) hem RPC içinde (gerçek zorlama, `IYS_ONAY_GEREKLI` hatası) yapılıyor
- [x] **Müşteri formuna İYS onay kutucuğu** eklendi (`marketing_consent` + `marketing_consent_updated_at`,
  yalnız değer değiştiğinde zaman damgalanır)
- [x] menu.ts: Bildirimler `yakinda` → `aktif` (zaten var olan `addonKey: "whatsapp_sms"` sayesinde
  eklenti aktif değilse otomatik `kilitli` düşüyor — `efektifMenu()`'de hiçbir değişiklik gerekmedi)
- [x] **Bilinçli kapsam dışı:** "ödeme gecikti" ve "kritik stok" tetikleyicileri (menü açıklamasında
  geçiyordu) bu turda eklenmedi — ödeme gecikmesi için henüz bir "vade tarihi" kavramı şemada yok
  (açık hesap satışlarında son ödeme tarihi izlenmiyor), kritik stok bildirimi ise müşteriye değil
  işletme sahibine gidecek farklı bir alıcı modeli gerektiriyor (dashboard'daki mevcut kritik stok
  kartıyla zaten karşılanıyor). Her ikisi de ayrı, küçük bir takip işi olarak bırakıldı
- [x] E2E: Showroom demo tenant'ına whatsapp_sms eklentisi aktif edilip gerçek panelde test edildi —
  pazarlama onayı olan bir müşteriye (Ahmet Yılmaz) kampanya mesajı gönderildi ve geçmişte
  "Gönderildi" olarak göründü; onayı olmayan bir müşteride (Elif Demir) hem arayüzün uyarı
  gösterdiği hem de RPC'nin `IYS_ONAY_GEREKLI` ile gerçekten engellediği (istemci kontrolünü
  atlayan doğrudan bir RPC çağrısıyla) doğrulandı; bir servis kaydının durumu panelden "Hazır"a
  çevrildiğinde otomatik bir "beklemede" bildirim kuyruğa düştüğü, gerçek `CRON_SECRET` ile
  tetiklenen `/api/cron/bildirim-gonder`'in bunu "gönderildi"ye çevirdiği ve geçmişte doğru
  göründüğü uçtan uca doğrulandı

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
| 3 (Gün 11-15) | Ürün + Stok + Döviz | ✅ Tamamlandı |
| 4 (Gün 16-20) | Satış + Kasa + Gider | ✅ Tamamlandı |
| 5 (Gün 21-24) | Alış + Cari | ✅ Tamamlandı |
| 6 (Gün 25-30) | Dashboard + Rapor + Konsol = MVP | ✅ Tamamlandı — MVP çekirdeği canlıda |
| 7-8 | Derinlik + pilot | Bekliyor |
| 9-12 | P1 modülleri | Bekliyor |
| 13+ | Masaüstü/Offline + P2 | Bekliyor |

> Modül ayrıntıları için proje dosyasının ilgili bölümleri esastır: Servis (B12), Satış (B14), Alış (B15), BOM (B16), Stok (B17), İkinci el (B19), Kasa (B21), Çek/Senet (B22), Cari (B23), Gider (B24), Konsol (B63-68).
