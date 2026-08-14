# BYTENOVA — İNŞA YOL HARİTASI

**Referans doküman:** [ByteNova_PROJE_DOSYASI_v2.md](ByteNova_PROJE_DOSYASI_v2.md)
**Son güncelleme:** 14 Ağustos 2026

## Altyapı Kararları

| Bileşen | Karar |
|---|---|
| Hosting / CI-CD | Vercel (proje: `byte-nova`) — her push'ta preview, `main` → production |
| Veritabanı / Auth / Storage | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| DNS | Cloudflare — `bytenova.cicibyte.com` subdomain → Vercel |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Masaüstü (ileri faz) | Tauri — lokal SQLite replika + donanım köprüsü |
| İzleme | Vercel Analytics + Sentry |

**Ortamlar:** `production` (bytenova.cicibyte.com) • `preview` (Vercel otomatik) • `local` (supabase CLI ile lokal stack)

**Çalışma prensipleri:**
- Her faz sonunda çalışan, deploy edilmiş bir ürün olacak; faz atlanmaz.
- Şema değişiklikleri yalnız migration dosyalarıyla yapılır (`supabase/migrations`), panelden elle şema değişikliği yasak.
- Tenant izolasyonu 1. günden RLS (Row Level Security) ile kurulur; sonradan eklenmez.
- Vergi/mevzuat değerleri koda gömülmez (kural tabloları).
- Her modül, proje dosyasındaki "UI → Service → Domain Rule → DB → Audit → Event" zinciriyle geliştirilir.

---

## FAZ 0 — Proje İskeleti ve Altyapı ✅ Hedef: "Merhaba ByteNova" canlıda

- [ ] Next.js projesi oluştur (App Router, TypeScript, Tailwind, ESLint/Prettier)
- [ ] Depo yapısı: `app/` `components/` `lib/` `supabase/` `docs/`
- [ ] Vercel projesine bağla, ilk deploy
- [ ] Cloudflare DNS: `bytenova.cicibyte.com` CNAME → Vercel, SSL doğrulama
- [ ] Supabase CLI kurulumu, migration altyapısı, tip üretimi (`database.types.ts`)
- [ ] Ortam değişkenleri düzeni (`.env.local`, Vercel env, `.env.example`)
- [ ] Temel tablolar migration'ı: `tenants`, `branches`, `users_profile`, `roles`, `feature_flags`, `audit_logs`, `settings`
- [ ] RLS politika şablonu: her tabloda `tenant_id` zorunlu + izolasyon testi
- [ ] Supabase Auth: e-posta/parola kayıt, giriş, parola sıfırlama akışları
- [ ] Sentry entegrasyonu + hata sayfaları (kullanıcıya ham exception gösterilmez)

**Bitti sayılır:** `bytenova.cicibyte.com` açılıyor, kayıt/giriş çalışıyor, tenant izolasyon testi geçiyor.

---

## FAZ 1 — Tasarım Sistemi ve Panel İskeleti 🎨 Hedef: "Ürünün tüm vizyonu ekranda"

- [ ] Tasarım token'ları: renk (koyu tema varsayılan + aydınlık), tipografi, spacing, radius
- [ ] Çekirdek bileşen seti: Button, Input, Select, Table (kompakt/rahat mod), Card, Badge, Modal, Toast, Skeleton, EmptyState
- [ ] Panel yerleşimi: daraltılabilir sol menü + global üst bar (arama, `+ Yeni`, kur göstergesi placeholder, bildirim, şube, profil)
- [ ] **Tam menü ağacı** (proje dosyası Bölüm 10) — feature flag'e bağlı `YAKINDA` / `BETA` / `PRO` rozetleri
- [ ] Feature flag altyapısı: `feature_flags` tablosu + istemci çözümü (`off | coming_soon | beta | on`)
- [ ] "Çok Yakında" tanıtım ekranı şablonu + "Hazır olunca haber ver" kaydı
- [ ] `Ctrl+K` komut paleti (arama + hızlı eylemler; şimdilik navigasyon)
- [ ] Responsive kırılımlar: mobil alt sekme çubuğu, tablo→kart dönüşümü
- [ ] Mikro animasyon standartları (150-250ms, `prefers-reduced-motion` desteği)

**Bitti sayılır:** Panele giren kullanıcı TÜM modülleri menüde görüyor; aktif olmayanlar zarif YAKINDA ekranı açıyor; mobilde kusursuz.

---

## FAZ 2 — Showroom 🌐 Hedef: Vitrin + kayıt kapısı

- [ ] Hero + slogan + panel önizleme animasyonu
- [ ] Sorun/çözüm şeridi ve modül turu (scroll animasyonlu kartlar)
- [ ] "Türkiye'nin gerçeklerine göre yazıldı" bölümü (döviz, e-belge, çek/senet, İYS...)
- [ ] Fiyatlandırma tablosu (Starter/Professional/Business/Enterprise)
- [ ] SSS, iletişim, KVKK/aydınlatma sayfaları
- [ ] Giriş/Kayıt butonları → panel auth akışına bağlantı
- [ ] 14 gün deneme akışı: kayıt → tenant oluşturma → "örnek veriyle keşfet / boş başla" seçimi
- [ ] SEO: meta, OpenGraph, sitemap; LCP < 2sn hedefi

**Bitti sayılır:** Showroom'dan kayıt olan kullanıcı kendi tenant'ıyla panele düşüyor.

---

## FAZ 3 — Kimlik, Kurulum Sihirbazı, RBAC, Audit 🔐

- [ ] Kurulum sihirbazı (12 adım, tümü atlanabilir — proje dosyası Bölüm 55)
- [ ] Rol sistemi: Sahip, Yönetici, Kasa, Teknisyen, Depo, Muhasebe, Şube Yöneticisi
- [ ] Eylem seviyesi yetkiler (maliyet görme, iskonto limiti, silme/iptal yetkisi)
- [ ] Kullanıcı davet akışı (e-posta ile personel ekleme)
- [ ] Audit log servisi: her kritik işlemde kim/ne zaman/önceki-yeni değer/sebep
- [ ] Audit görüntüleme ekranı (yönetici)
- [ ] MFA opsiyonu

**Bitti sayılır:** İki farklı rolle girildiğinde ekranlar ve yetkiler doğru ayrışıyor; kritik işlemler audit'te izleniyor.

---

## FAZ 3B — Platform Yönetim Konsolu v1 🛡 (Master Admin)

> Referans: Proje dosyası Bölüm VIII. Konsol, tenant panelinden ayrı kimlik havuzu ve ayrı yüzeydir.

- [ ] Konsol yüzeyi (`konsol.` subdomain / ayrık route grubu) + `platform_admins` kimlik havuzu + **zorunlu MFA**
- [ ] Master Admin seed hesabı + admin davet/rol yönetimi (Master, Yönetici, Finans, Destek, Analist)
- [ ] "Son Master Admin silinemez" ve rol bazlı yetki kuralları
- [ ] Tenant listesi: arama/filtre + hazır segmentler (deneme bitenler, ödemesi gecikenler, pasifler)
- [ ] Tenant 360° detay: profil, kullanım metrikleri, olay zaman çizelgesi (`tenant_events`), destek notları
- [ ] Abonelik modeli: `subscription_plans`, `subscriptions` — Trial → Aktif → Ödeme Bekliyor → Askıda → İptal yaşam döngüsü
- [ ] Trial bitiş otomasyonu: süre dolunca otomatik `Ödeme Bekliyor` + grace period sonrası otomatik askı
- [ ] İşlemler: **deneme/abonelik uzatma (sebep zorunlu), askıya alma, yeniden etkinleştirme, plan değiştirme**
- [ ] Askıdaki tenant deneyimi: panel salt-okunur + "Aboneliğiniz beklemede" ekranı (veri asla silinmez)
- [ ] **Manuel ödeme akışı (havale/EFT):** dekont yükleme → Finans onayı → otomatik uzatma
- [ ] Feature flag yönetim ekranı (tenant/plan bazlı `coming_soon → beta → on` geçişleri)
- [ ] `platform_audit_logs`: tüm konsol eylemleri gerekçeli loglanır
- [ ] Duyuru sistemi v1 (tenant panellerine banner)

**Bitti sayılır:** Deneme süresi biten tenant otomatik beklemeye düşüyor; konsoldan tek tıkla uzatılıp yeniden aktifleştirilebiliyor; dekont onayı aboneliği uzatıyor; ikinci bir admin davet edilip rolle çalışabiliyor.

---

## FAZ 4 — Müşteri ve Cihaz 👥

- [ ] Müşteri CRUD: bireysel/kurumsal, vergi bilgileri (TCKN/VKN), çoklu telefon/adres
- [ ] İYS izin alanları (arama/SMS/e-posta — şimdilik kayıt, entegrasyon P1)
- [ ] Müşteri 360° ekranı (özet şerit: satış/servis/cihaz/bakiye)
- [ ] İletişim geçmişi kaydı (manuel not + otomatik olaylar)
- [ ] Cihaz varlığı: tür, marka/model, seri no (tenant içi benzersiz), IMEI/MAC
- [ ] Cihaz zaman çizelgesi (alış→satış→servis geçmişi iskeleti)
- [ ] Global arama v1: müşteri adı, telefon, seri no

**Bitti sayılır:** Telefon numarası yazınca müşteri ve cihazları saniyeler içinde bulunuyor.

---

## FAZ 5 — Ürün, Stok ve Döviz 📦💵

- [ ] Ürün kartı (tam alan seti: SKU, barkodlar, kategori, birim, KDV, min/kritik stok, seri no zorunluluğu...)
- [ ] **Döviz altyapısı:** `currencies`, `exchange_rates`; TCMB kur çekme (günlük cron) + manuel "dükkân kuru"
- [ ] Dövizli alış fiyatı + TL satış fiyatı; fiyat listeleri (perakende KDV dahil / toptan hariç)
- [ ] Fiyat kuralları: `satış = maliyet × kur × marj` + yuvarlama
- [ ] "Kur değişti → etkilenen ürünler → toplu güncelle" ekranı
- [ ] Stok hareketleri altyapısı: her hareket kayda bağlı (alış/satış/servis/iade/transfer/sayım/düzeltme)
- [ ] Negatif stok politikası (tenant ayarı: izinli-uyarılı / onaylı / yasak)
- [ ] Depo + raf konumu; sayım akışı (snapshot → fark → onay → düzeltme)
- [ ] Kritik stok uyarıları
- [ ] Üst bar kur göstergesi canlıya bağlanır

**Bitti sayılır:** USD'li ürün alışı girilip kur değişince tek ekrandan TL fiyatlar güncellenebiliyor; her stok değişiminin "neden"i var.

---

## FAZ 6 — SERVİS MODÜLÜ (Ürünün Kalbi) 🔧

- [ ] Servis kabul akışı: müşteri → cihaz → beyan → aksesuarlar → checklist → fotoğraflar → beyan metinleri onayı → servis no (`BN-YYYY-XXXXXX`)
- [ ] Durum makinesi + durum geçmişi (tüm durumlar, tek aktif ana durum kuralı)
- [ ] Teknisyen atama + teknisyen ana ekranı ("bana atananlar", öncelikler)
- [ ] Kanban görünümü (sürükle-bırak durum değişimi)
- [ ] Teşhis → teklif → müşteri onayı akışı (onay kanalı + tarih/saat kaydı)
- [ ] Parça kullanımı: stoktan rezervasyon → onay sonrası çıkış; müşteri parçası; **sökülen parça akıbeti (zorunlu alan)**
- [ ] Kapora/avans alma + teslim anında mahsup
- [ ] Ücretli teşhis kuralı (red senaryosu)
- [ ] Stokta olmayan parça → `Parça Bekleniyor` + satın alma talebi
- [ ] Servis formu + teslim tutanağı PDF (QR kodlu, beyan metinleriyle)
- [ ] Servis fotoğrafları (Supabase Storage, tenant izolasyonlu)
- [ ] Teslim alınmayan cihaz sayaçları + hatırlatma görevleri (SMS entegrasyonu P1'de, şimdilik görev/uyarı)
- [ ] Servis garantisi ilişkisi (tekrar gelen cihaz → kaynak servis bağlantısı)
- [ ] Azami tamir süresi (20 iş günü) sayacı — garanti kapsamı işaretli servislerde

**Bitti sayılır:** Proje dosyasındaki S1 (ekran kırık laptop) ve S2 (onay vermeyen müşteri) senaryoları uçtan uca sistemde yürüyor.

---

## FAZ 7 — Satış, Kasa ve Giderler 💰

- [ ] Hızlı satış (POS) ekranı: `F2 → ara/barkod → miktar → iskonto → ödeme → belge tipi` (klavye öncelikli)
- [ ] Karma satış kalemleri (ürün + işçilik + hizmet aynı fişte)
- [ ] İskonto: satır + genel + yuvarlama; **rol bazlı iskonto limiti + yönetici onayı (PIN)**
- [ ] Karma ödeme (nakit + kart bölüşümü); taksit kaydı + parametrik taksit limit kuralları
- [ ] Belge tipi seçimi: manuel ÖKC modu ("fiş no: ___") / "sonra kesilecek" (e-belge P1)
- [ ] Servisle ilişkili satış (servis kapanışı → tahsilat → satış kaydı otomatik)
- [ ] İade akışı: `İade Alındı → Kontrol → Satılabilir/Arızalı/Hurda/Servise` + orijinal satış bağı
- [ ] Kasa hesapları (nakit kasa, banka, POS cihazları) + kasa hareketleri
- [ ] Kasa kapanışı: beklenen/fiili nakit, POS toplamları, fark + zorunlu açıklama
- [ ] **Gider modülü:** kategoriler, hızlı giriş, fiş fotoğrafı, tekrarlayan gider hatırlatması
- [ ] Dijital ürün (lisans key havuzu) — basit sürüm

**Bitti sayılır:** Sabah satış → akşam kasa kapanışı döngüsü gerçek bir dükkân temposunda sorunsuz; iskonto limiti aşımı onaysız kapanmıyor.

---

## FAZ 8 — Alış, Tedarikçi ve Cari 🚚

- [ ] Tedarikçi kartı (çalışma para birimi, IBAN, XML feed alanı)
- [ ] Alış faturası girişi: dövizli, seri numaralı ürün girişi, masraf dağıtımı, geriye dönük belge tarihi
- [ ] Alış → stok girişi → maliyet güncelleme (ortalama + son alış) → fiyat kuralı tetikleme
- [ ] Satın alma talepleri ekranı (servisten ve kritik stoktan gelenler)
- [ ] Cari altyapısı: müşteri/tedarikçi bakiyeleri, vade takibi, yaşlandırma (30/60/90)
- [ ] Dövizli cari (USD borç izleme, ödeme anında kur farkı kaydı)
- [ ] Açık hesap satış → cari borçlanma; tahsilat → bakiye düşme
- [ ] Cari ekstre PDF
- [ ] Konsinye mal bayrağı (basit sürüm)

**Bitti sayılır:** S3 (stoksuz parça → talep → alış → servise otomatik bağlanma) senaryosu uçtan uca çalışıyor; toptancıya USD borç doğru izleniyor.

---

## FAZ 9 — Dashboard ve Raporlar 📊

- [ ] Rol bazlı dashboard kartları (satış, tahsilat, açık servisler, teslimler, kritik stok, kur etkisi, teslim alınmayanlar)
- [ ] Akıllı özet cümleleri ("Bugün teslim edilecek 7 servis var...")
- [ ] Satış raporları (gün/ay/ürün/kategori/personel/iskonto)
- [ ] Kârlılık raporları — **maliyet yöntemi seçilebilir** (ortalama / son alış / güncel kur)
- [ ] Servis raporları (süre, teknisyen performansı, tekrar oranı)
- [ ] Stok raporları (kritik, hareketsiz, değer — TL + döviz, negatif stok)
- [ ] Finans: nakit akış görünümü, cari yaşlandırma
- [ ] **Muhasebeci paketi v1:** ay sonu Excel export (satışlar, alışlar, giderler)

**Bitti sayılır:** Sahibi akşam tek ekrandan günü görüyor; ay sonunda SMMM'ye tek tıkla paket gidiyor.

---

## FAZ 10 — Devir, Sertleştirme ve Pilot 🚀 = MVP LANSMANI

- [ ] Excel import sihirbazı: müşteri, ürün, stok, tedarikçi, cihaz, **cari açılış bakiyeleri, açık servisler**
- [ ] Demo veri seti ("örnek veriyle keşfet")
- [ ] Yedekleme stratejisi: Supabase otomatik yedek + tenant bazlı tam export
- [ ] Performans: kritik listelerde sanal kaydırma, sorgu optimizasyonu, indeksler
- [ ] Güvenlik taraması: RLS testleri, rate limiting, dosya yükleme sertleştirme
- [ ] E2E test paketi (S1, S2, S3, S11 senaryoları otomatik)
- [ ] Onboarding dokümanları + kısa eğitim videoları
- [ ] 2-3 gerçek bilgisayarcıyla pilot; geri bildirim döngüsü
- [ ] Fiyatlandırma/paket kilitleri (Starter/Pro ayrımı feature flag'lerle)

**Bitti sayılır:** Gerçek bir dükkân bir haftasını yalnız ByteNova ile yönetebiliyor.

---

## FAZ 11 — P1 Modülleri (Lansman sonrası 2-4 ay) 📈

Sıralama pilot geri bildirimine göre revize edilir; öngörülen öncelik:

1. **e-Belge:** Entegratör soyutlaması + ilk entegratör (e-Arşiv/e-Fatura), gider pusulası, entegratörsüz "portal modu"
2. **WhatsApp/SMS + İYS:** Sağlayıcı soyutlaması, servis bildirimleri, İYS izin senkronu, müşteri onay linki
3. **Çek/Senet + POS mutabakat:** Portföy, vade takvimi, nakit akış uyarıları
4. **PC Toplama (BOM):** Reçeteler, toplama emri, demontaj, parça hasadı
5. **Toptancı XML:** İlk 2-3 distribütör adaptörü, eşleştirme, fiyat kuralı entegrasyonu
6. **Müşteri servis takip sayfası:** QR ile servis durumu görüntüleme + online onay
7. **Bakım sözleşmeleri:** SLA, periyodik ziyaret görevleri, otomatik faturalama
8. **Prim modülü** + gelişmiş raporlar
9. **Uyumluluk matrisi**, ÖKC entegrasyonu (ilk marka), vergi kural motoru tam sürüm (tevkifat/özel matrah)
10. **Otomatik abonelik tahsilatı:** `BillingProvider` soyutlaması + ilk sağlayıcı (iyzico/PayTR), dunning, abonelik faturaları, impersonation (destek oturumu), platform metrik panosu (MRR, churn, dönüşüm)

---

## FAZ 12 — Masaüstü Uygulaması (Online + Offline) 💻

- [ ] Tauri kabuğu: panel + imzalı otomatik güncelleme + sistem tepsisi
- [ ] Lokal SQLite replika (müşteri/ürün/stok/açık servis/kur) + delta senkron
- [ ] Outbox deseni: offline satış ve servis kabul kuyruğu, idempotent sunucu işleme
- [ ] Çakışma kutusu ekranı (yetkili onaylı çözüm)
- [ ] "Resmi belge offline üretilmez" kuralı — belge bekleyenler kuyruğu
- [ ] Donanım köprüsü: termal/A4/etiket yazıcı, barkod okuyucu; ÖKC köprüsü
- [ ] Lokal DB şifreleme + offline oturum güvenliği
- [ ] Bağlantı kopma/gelme simülasyon testleri

**Bitti sayılır:** S10 senaryosu (internet kesildi, dükkân çalışmaya devam etti) gerçek donanımda doğrulanıyor.

---

## FAZ 13 — P2 Ufku 🔭

Çok şube (transfer, konsolide rapor) • Mobil teknisyen uygulaması • Pazaryeri entegrasyonları (Trendyol/Hepsiburada/N11) + cayma hakkı akışı • Kargo entegrasyonları • Sanal POS/ödeme linki • AI asistan (arıza özeti, fiyat önerisi, stok tahmini) • Marketplace/eklenti altyapısı • Dışa açık API (Enterprise)

---

## İlerleme Takibi

Her faz tamamlandığında bu dosyada işaretlenir ve `docs/CHANGELOG.md`'ye özet düşülür. Faz içi görevler GitHub Issues/Projects üzerinden yürütülebilir.

| Faz | Durum | Tarih |
|---|---|---|
| 0 — İskelet ve altyapı | ⏳ Sırada | — |
| 1 — Tasarım sistemi + panel | Bekliyor | — |
| 2 — Showroom | Bekliyor | — |
| 3 — Kimlik/RBAC | Bekliyor | — |
| 3B — Yönetim Konsolu v1 | Bekliyor | — |
| 4 — Müşteri/Cihaz | Bekliyor | — |
| 5 — Ürün/Stok/Döviz | Bekliyor | — |
| 6 — Servis | Bekliyor | — |
| 7 — Satış/Kasa/Gider | Bekliyor | — |
| 8 — Alış/Tedarikçi/Cari | Bekliyor | — |
| 9 — Dashboard/Raporlar | Bekliyor | — |
| 10 — Devir/Pilot (MVP) | Bekliyor | — |
| 11 — P1 | Bekliyor | — |
| 12 — Masaüstü/Offline | Bekliyor | — |
| 13 — P2 | Bekliyor | — |
