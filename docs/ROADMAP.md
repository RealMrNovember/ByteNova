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
- [ ] Resend SMTP geçişi (DNS doğrulaması bekleniyor — `docs/RESEND_DNS.md`)

**Sprint sonu:** ✅ Panel, ürünün tüm vizyonunu menüde gösteriyor; rol sistemi, davet ve audit çalışıyor.

---

## SPRINT 2 — İLK GERÇEK DEĞER: MÜŞTERİ + SERVİS (Gün 6-10)

### Gün 6 — Müşteri
- [ ] Müşteri CRUD (bireysel/kurumsal, vergi alanları, çoklu telefon) + arama
- [ ] Müşteri 360° iskeleti + iletişim geçmişi kaydı

### Gün 7 — Cihaz
- [ ] Cihaz varlığı: tür, marka/model, seri no (tenant içi benzersiz), IMEI/MAC
- [ ] Cihaz-müşteri ilişkisi + cihaz zaman çizelgesi iskeleti
- [ ] Global arama: telefon/seri no ile anında bulma

### Gün 8 — Servis kabul
- [ ] Kabul akışı: müşteri → cihaz → beyan → aksesuarlar → dinamik checklist → beyan metni onayı
- [ ] Servis no üretimi (`BN-2026-XXXXXX`) + durum makinesi altyapısı

### Gün 9 — Servis operasyonu
- [ ] Servis listesi + detay ekranı + durum geçmişi
- [ ] Teknisyen atama + teknisyen "bana atananlar" ekranı + teknik notlar
- [ ] Öncelik sistemi (Düşük/Normal/Yüksek/Acil)

### Gün 10 — Servis çıktıları
- [ ] Cihaz fotoğrafı yükleme (Supabase Storage, tenant izolasyonlu)
- [ ] Servis kabul formu + teslim tutanağı PDF (QR kodlu)
- [ ] Teslim akışı: aksesuar kontrolü + kapanış

**Sprint sonu:** 🎯 **Dükkânda kullanılabilir ilk sürüm** — S1 senaryosunun servis tarafı uçtan uca dönüyor.

---

## SPRINT 3 — ÜRÜN, STOK, DÖVİZ (Gün 11-15)

### Gün 11 — Ürün
- [ ] Ürün kartı (SKU, barkodlar, kategori, KDV, min/kritik stok, seri no zorunluluğu)
- [ ] Kategori yönetimi + hızlı ürün ekleme

### Gün 12 — Döviz çekirdeği
- [ ] `currencies` + `exchange_rates`; TCMB kur çekme (günlük cron) + manuel dükkân kuru
- [ ] Dövizli alış fiyatı; fiyat kuralı: `satış = maliyet × kur × marj` + yuvarlama
- [ ] Üst barda canlı kur göstergesi

### Gün 13 — Stok hareketleri
- [ ] Hareket altyapısı: her hareket kayda bağlı (alış/satış/servis/iade/düzeltme)
- [ ] Servis parça kullanımı → rezervasyon → onayla stok çıkışı (Sprint 2'ye bağlanır)
- [ ] Sökülen parça akıbeti alanı

### Gün 14 — Fiyat yönetimi
- [ ] "Kur değişti → etkilenen ürünler → toplu güncelle" ekranı
- [ ] Fiyat listeleri: perakende (KDV dahil) / toptan (hariç)
- [ ] Kritik stok uyarıları

### Gün 15 — Stok disiplini
- [ ] Negatif stok politikası (tenant ayarı: uyarılı/onaylı/yasak)
- [ ] Sayım v1 (snapshot → fark → onay → düzeltme + audit)

**Sprint sonu:** USD'li alış → kur → TL satış fiyatı zinciri çalışıyor; her stok değişiminin "neden"i var.

---

## SPRINT 4 — SATIŞ VE KASA (Gün 16-20)

### Gün 16 — Hızlı satış
- [ ] POS ekranı: `F2 → ara/barkod → miktar → ödeme` klavye akışı
- [ ] Karma kalemler (ürün + işçilik + hizmet)

### Gün 17 — İskonto ve ödeme
- [ ] Satır + genel iskonto + yuvarlama; rol bazlı iskonto limiti + yönetici PIN onayı
- [ ] Karma ödeme (nakit+kart) + taksit kaydı (parametrik limit kuralları)

### Gün 18 — Kasa ve tahsilat
- [ ] Kasa hesapları (nakit, banka, POS cihazları) + hareketler
- [ ] Servis kapanışında tahsilat + kapora/avans alma ve mahsup

### Gün 19 — Gider + kasa kapanışı
- [ ] Gider modülü (kategoriler, hızlı giriş, fiş fotoğrafı, tekrarlayan gider)
- [ ] Kasa kapanışı (beklenen/fiili, fark + zorunlu açıklama)

### Gün 20 — Belge ve iade
- [ ] Belge tipi seçimi: manuel ÖKC modu ("fiş no: ___") / "sonra kesilecek" kuyruk
- [ ] İade akışı (`İade Alındı → Kontrol → Satılabilir/Arızalı/Hurda/Servise`)

**Sprint sonu:** 🎯 Sabah satış → akşam kasa kapanışı döngüsü gerçek dükkân temposunda tamam.

---

## SPRINT 5 — ALIŞ, TEDARİKÇİ, CARİ (Gün 21-24)

### Gün 21 — Tedarikçi + alış
- [ ] Tedarikçi kartı (para birimi, IBAN) + dövizli alış faturası girişi (geriye dönük tarih destekli)
- [ ] Alış → stok girişi → maliyet güncelleme → fiyat kuralı tetikleme

### Gün 22 — Cari
- [ ] Müşteri/tedarikçi bakiyeleri + açık hesap satış → borçlanma → tahsilat düşme
- [ ] Dövizli cari (USD borç, ödeme anında kur farkı kaydı)

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
- [ ] Konsol yüzeyi + `platform_admins` (ayrı kimlik, zorunlu MFA) + Master Admin seed
- [ ] Tenant listesi + Tenant 360° + `tenant_events`

### Gün 29 — Yönetim Konsolu v1b
- [ ] Abonelik modeli: Trial → Aktif → Ödeme Bekliyor → Askıda yaşam döngüsü + trial otomasyonu
- [ ] Uzatma / askıya alma / yeniden etkinleştirme; askıdaki tenant salt-okunur deneyimi
- [ ] Manuel ödeme (havale/dekont onay) akışı

### Gün 30 — Sertleştirme
- [ ] Admin davet/rol yönetimi + `platform_audit_logs` + feature flag yönetim ekranı
- [ ] RLS güvenlik taraması + E2E test paketi (S1, S2, S3) + performans geçişi

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
| 2 (Gün 6-10) | Müşteri + Servis çekirdeği | Bekliyor |
| 3 (Gün 11-15) | Ürün + Stok + Döviz | Bekliyor |
| 4 (Gün 16-20) | Satış + Kasa + Gider | Bekliyor |
| 5 (Gün 21-24) | Alış + Cari | Bekliyor |
| 6 (Gün 25-30) | Dashboard + Rapor + Konsol = MVP | Bekliyor |
| 7-8 | Derinlik + pilot | Bekliyor |
| 9-12 | P1 modülleri | Bekliyor |
| 13+ | Masaüstü/Offline + P2 | Bekliyor |

> Modül ayrıntıları için proje dosyasının ilgili bölümleri esastır: Servis (B12), Satış (B14), Alış (B15), BOM (B16), Stok (B17), İkinci el (B19), Kasa (B21), Çek/Senet (B22), Cari (B23), Gider (B24), Konsol (B63-68).
