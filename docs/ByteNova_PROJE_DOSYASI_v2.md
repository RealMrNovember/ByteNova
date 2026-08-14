# BYTENOVA — PROFESYONEL ÜRÜN VE PROJE DOSYASI

**Ürün:** ByteNova
**Konumlandırma:** Bilgisayar, elektronik ve teknik servis işletmeleri için uçtan uca işletme yönetim platformu
**Hedef pazar:** Türkiye'deki bilgisayarcılar, teknik servisler, bilgisayar mağazaları ve zaman içinde diğer elektronik servis işletmeleri
**Doküman sürümü:** 2.0 (v1.0 üzerine Türkiye gerçek hayat senaryosu eksik analizi işlenmiş tam sürüm)
**Tarih:** 14 Ağustos 2026
**Ürün karakteri:** Online + Offline çalışabilen masaüstü uygulaması, tam responsive web paneli ve halka açık Showroom sitesinden oluşan, Türkiye pazarına göre tasarlanmış profesyonel SaaS işletme sistemi

---

# BÖLÜM I — ÜRÜN TANIMI

## 1. ÜRÜNÜN ANA FİKRİ

ByteNova, bir bilgisayarcının dükkânını yönetirken kullandığı dağınık araçların yerine tek bir operasyon merkezi koyar.

Bugün tipik bir işletmede aynı anda WhatsApp mesajları, Excel dosyaları, kâğıt servis formları, stok defteri, kasa notları, toptancı B2B ekranları, muhasebe programı ve sahibinin hafızası kullanılıyor. ByteNova bunları tek bir iş akışında birleştirir.

ByteNova'nın temel sorusu:

> "Bu cihaz veya ürün işletmeye nasıl girdi, kaç dolara/kaç liraya mal oldu, şu anda nerede, kime ait, üzerinde ne işlem yapıldı, hangi parça kullanıldı, müşteriye ne söylendi, hangi belge kesildi, ne kadar tahsil edildi, ne kadar kâr kaldı ve son olarak kime teslim edildi?"

Sistem bu soruların tamamına geçmişe dönük ve denetlenebilir cevap verebilmelidir.

### İki yaşam döngüsünün kesişimi

**Servis döngüsü:**
Giriş → Kabul → Teşhis → Teklif → Kapora → Onay → Parça → Onarım → Test → Teslim → Tahsilat → Garanti → Tekrar servis

**Ticari döngü:**
Toptancı (USD) → Alış → Depo → Stok → (Gerekirse PC Toplama) → Satış (TL) → Belge (Fiş/Fatura) → Kasa/POS/Çek → Kârlılık → Rapor

Bu iki döngünün kesiştiği yer ByteNova'nın asıl değeridir.

---

## 2. VİZYON, MİSYON, UZUN VADE

### Vizyon
Türkiye'deki teknik servis işletmesinin yalnızca servis fişi yazdıran değil, bütün ticari operasyonunu yöneten ana yazılımı olmak.

### Misyon
Küçük bilgisayarcıdan çok şubeli teknik servis işletmesine kadar herkesin kolayca kullanabileceği; fakat arka planda kurumsal düzeyde stok, servis, finans, döviz, belge, müşteri, yetki ve raporlama altyapısına sahip bir sistem oluşturmak.

### Uzun vadeli hedef
ByteNova'nın "bilgisayarcı programı" olarak başlayıp "Teknik Servis İşletim Sistemi" haline gelmesi.

Potansiyel dikeyler:

- Bilgisayar ve laptop servisleri
- Telefon/tablet servisleri (yenileme mevzuatı desteğiyle)
- Oyun konsolu servisleri
- Yazıcı ve sarf servisleri
- Kamera ve güvenlik sistemleri servisleri
- Elektronik cihaz servisleri
- Kurumsal IT destek firmaları (bakım sözleşmeli)
- Yenilenmiş cihaz alım-satımı yapan işletmeler

---

## 3. HEDEF KULLANICILAR

### Persona A — Tek dükkân sahibi
2-3 personel. İhtiyacı: servis kaydı, stok, satış, alış, müşteri, kasa, günlük rapor, kur takibi, muhasebeciye ay sonu paketi. Ana ekran mümkün olduğunca sade olmalıdır.

### Persona B — Yoğun teknik servis
5-15 teknisyen. İhtiyacı: teknisyen atama, servis aşamaları, parça kullanımı, dış servis takibi, kargo ile cihaz alma, test sonuçları, fotoğraf, müşteri onayı, kapora, teslim, prim ve performans raporları.

### Persona C — Mağaza + servis işletmesi
Hem yeni ürün satıyor hem tamir yapıyor hem PC topluyor. İhtiyacı: POS benzeri hızlı satış, ÖKC/fatura ayrımı, taksit, iskonto, stok, seri numarası, dövizli alış maliyeti, satış kârlılığı, toptancı XML fiyatları, servis, cari, çek/senet, tedarikçi.

### Persona D — Çok şubeli işletme
İhtiyacı: merkezden yönetim, şube bazlı stok ve kasa, personel yetkileri, şubeler arası transfer, konsolide raporlar, merkezi ürün kataloğu ve fiyat listeleri.

### Persona E — Kurumsal IT servis sağlayıcı
Okul, şirket, belediye gibi müşterilere sözleşmeli bakım veriyor. İhtiyacı: periyodik bakım sözleşmeleri, SLA, yerinde servis, toplu iş emri, açık hesap, tevkifatlı fatura, mutabakat.

---

## 4. TÜRKİYE PAZARI İÇİN TEMEL TASARIM PRENSİPLERİ

ByteNova Türkiye'ye özgü kullanım davranışlarını ve ticari gerçekleri merkeze alır. Bu bölüm ürünün anayasasıdır; her modül bu prensiplerle test edilir.

### 4.1. İşletme sahibi teknik personel de olabilir
Sistem sadece muhasebecinin anlayacağı bir ERP gibi tasarlanmaz. Dükkân sahibi aynı gün müşteri karşılar, laptop söker, mal alır, kasa kapatır. Kullanıcı deneyimi: hızlı, az tıklamalı, arama merkezli, klavye dostu, Türkçe ve teknik bilgisi düşük kullanıcıya da anlaşılır olmalıdır.

### 4.2. Fiyatlar dolarla gelir, lirayla satılır — DÖVİZ GERÇEĞİ
Türkiye'de bilgisayar parçası ticareti fiilen USD bazlıdır. Toptancı fiyatı dolar verir, bayi TL satar, kur değişince etiketler değişir.

Bu nedenle ByteNova'da:

- Ürün alış fiyatı **para birimi ile** tutulur (USD/EUR/TL).
- Günlük kur (TCMB + manuel "dükkân kuru" override) sistemde her zaman günceldir.
- TL satış fiyatı; dövizli maliyet + kâr kuralından **otomatik türetilebilir** veya sabitlenebilir.
- "Kur değişti → etkilenen ürünleri göster → toplu fiyat güncelle → yeni etiketleri bas" akışı tek ekrandır.
- Cari hesaplar dövizli tutulabilir (toptancıya borç USD izlenir); kur farkı kaydı/faturası desteklenir.
- Kârlılık raporları hem **ortalama maliyet** hem **son alış / güncel yenileme maliyeti** ile hesaplanabilir. Yüksek enflasyonda ortalama maliyet yanıltıcıdır; sistem bunu kullanıcıya seçenek olarak sunar.

### 4.3. Perakendede belge fiştir — ÖKC GERÇEĞİ
Perakende satışta çoğunlukla fatura değil **yeni nesil ÖKC (yazarkasa POS) fişi** kesilir; banka POS'u da bu cihazın içindedir. ByteNova satış kapanışında "Fiş (ÖKC) / e-Arşiv Fatura / e-Fatura" belge tipini sorar, ÖKC entegrasyonunu (Ingenico, Hugin, Profilo vb.) modüler sağlar, entegrasyon yoksa "fiş kesildi, no: ___" manuel işaretleme modu sunar.

### 4.4. Pazarlık ve iskonto satışın doğasıdır
Satır iskontosu, genel toplam iskontosu ve "küsuratı sil" yuvarlaması birinci sınıf özelliktir. İskonto **yetki limitine** bağlıdır (ör. kasa personeli %5'e kadar, üstü yönetici onayı ister) ve audit'e yazılır.

### 4.5. Taksit ve komisyon gerçeği
Elektronik ürünlerde BDDK taksit sınırları vardır ve değişkendir; sistem bunu **parametrik kural motoru** ile bilir, sabit kodlamaz. Taksit sayısına göre vade farkı eklenebilir. POS komisyonu ve paranın hesaba blokeli/gecikmeli geçmesi kasa mutabakatında ve net kârlılıkta hesaba katılır.

### 4.6. KOBİ dünyasında çek ve senet vardır
Toptancıya çekle ödenir, kurumsal müşteriden çek alınır. Çek/senet portföyü (vade, banka, ciro, tahsil, karşılıksız) cari sistemin parçasıdır.

### 4.7. WhatsApp gerçeği
Müşteri iletişimi WhatsApp'tan yürür. "Cihazınız hazır, toplam 1.250 TL" gibi hazır bildirimler üretilir; gönderim, değiştirilebilir sağlayıcı katmanından yapılır. Ticari (kampanya) iletiler **İYS onayına** tabidir, operasyonel bildirimlerden ayrı yönetilir.

### 4.8. Kâğıt tamamen yok sayılamaz
Servis kabul formu, teslim tutanağı, gider pusulası, imza alanları sahada gereklidir. Her kritik belge için PDF üretme, yazdırma (A4 + termal), e-posta/WhatsApp paylaşımı ve imza altyapısı vardır.

### 4.9. İnternet kesilebilir — OFFLINE GERÇEĞİ
Masaüstü uygulaması internet yokken satış yapabilmeli, servis kabul edebilmeli, müşteri ve stok görebilmelidir. Bağlantı gelince güvenli senkronizasyon yapılır (bkz. Bölüm 7 ve 46).

### 4.10. Muhasebeyi dışarıdaki SMMM tutar
Küçük işletmenin resmi muhasebesi mali müşavirdedir. ByteNova muhasebe programı değildir; ay sonunda "muhasebeci paketi" (alış/satış belgeleri, Z raporları, gider pusulaları — Luca/Logo/Mikro/Zirve uyumlu export) üretir.

### 4.11. Mevzuat değişir, kod değişmemeli
KDV oranları, tevkifat oranları, taksit limitleri, e-belge zorunluluk eşikleri, garanti süreleri **asla sabit kodlanmaz**; tarihsel olarak versiyonlanabilir kural/konfigürasyon katmanından yönetilir.

### 4.12. Eski programdan geçiş bariyeri
Devir sırasında yalnız müşteri/ürün değil; **cari açılış bakiyeleri** (kim ne kadar borçlu) ve **açık servisler** de taşınabilmelidir.

---

# BÖLÜM II — PLATFORM MİMARİSİ

## 5. ÜÇ YÜZEY: SHOWROOM + WEB PANELİ + MASAÜSTÜ UYGULAMASI

ByteNova tek çekirdek, üç yüzeyden oluşur:

| Yüzey | Amaç | Teknoloji karakteri |
|---|---|---|
| **Showroom** (bytenova.com) | Halka açık tanıtım sitesi; Giriş / Kayıt kapısı | Statik + hızlı, SEO dostu, etkileyici |
| **Web Paneli** (app.bytenova.com) | Tam işletme yönetim paneli, her cihazdan | SPA/PWA, tam responsive |
| **Masaüstü Uygulaması** (Windows öncelikli) | Online + Offline çalışma, yazıcı/barkod/ÖKC donanım köprüsü | Web çekirdeğini saran native istemci + lokal veritabanı |

İleride: **Mobil Teknisyen** uygulaması (P2).

Üç yüzey aynı API'yi ve aynı tasarım sistemini kullanır. Masaüstü uygulaması web panelinin birebir aynısıdır; üstüne offline katmanı ve donanım erişimi ekler. Kullanıcı hangi yüzeyde olursa olsun aynı ekranı görür — öğrenme maliyeti sıfırlanır.

---

## 6. SHOWROOM SPESİFİKASYONU

Showroom, ByteNova'nın vitrinidir ve sisteme giriş kapısıdır.

### 6.1. Sayfa yapısı

1. **Hero:** Ürün sloganı + canlı ürün animasyonu (panel ekranının hareketli önizlemesi) + `Ücretsiz Dene` ve `Giriş Yap` butonları.
2. **Sorun/Çözüm şeridi:** "WhatsApp'ta kaybolan servisler, Excel'de dağılan stok, deftere yazılan veresiye" → tek platform anlatımı.
3. **Modül turu:** Servis, Satış, Stok, Kasa, Cari, Raporlar — her biri ekran görüntülü, scroll'a bağlı animasyonlu kartlar.
4. **Türkiye'ye özel bölümü:** Döviz takibi, e-belge, ÖKC, çek/senet, gider pusulası, İYS — "Türkiye'nin gerçeklerine göre yazıldı" mesajı. Bu bölüm rakiplerden ayrışmanın vitrinidir.
5. **Canlı demo/etkileşimli önizleme:** Kayıt olmadan gezilebilen örnek verili salt-okunur demo paneli.
6. **Fiyatlandırma:** Paket karşılaştırma tablosu.
7. **SSS + iletişim + KVKK/aydınlatma bağlantıları.**
8. **Footer:** Yasal metinler, sosyal, durum sayfası (status.bytenova.com).

### 6.2. Giriş / Kayıt

- Sağ üstte kalıcı `Giriş Yap` ve `Kayıt Ol`.
- Kayıt akışı: e-posta + parola → doğrulama → kurulum sihirbazına düşer (Bölüm 53).
- Giriş: e-posta/parola + opsiyonel MFA; "beni hatırla"; parola sıfırlama.
- Kayıt olan kullanıcı otomatik **14 gün tam özellikli deneme** tenant'ı alır; demo verisiyle dolu başlatma seçeneği sunulur ("Örnek verilerle keşfet / Boş başla").

### 6.3. Showroom performans hedefleri

- LCP < 2 sn, tam SEO, OpenGraph kartları.
- Animasyonlar `prefers-reduced-motion` ayarına saygılıdır.
- Mobilde tek elle gezilebilir.

---

## 7. ONLINE + OFFLINE MASAÜSTÜ MİMARİSİ (ÖZET)

> Teknik detay Bölüm 46'dadır; burada ürün davranışı tanımlanır.

### 7.1. Çalışma modları

- **Online:** Her işlem doğrudan sunucuya; lokal önbellek arka planda güncel tutulur.
- **Offline:** İnternet kesilince uygulama kesintisiz devam eder. Yapılabilenler:
  - Satış (fiş/tahsilat kaydı lokalde kuyruklanır)
  - Servis kabul + durum güncelleme + not/fotoğraf
  - Müşteri/ürün/stok görüntüleme ve arama (lokal replika)
  - Yazdırma (servis formu, etiket)
- Offline'da **yapılamayanlar** açıkça bildirilir: e-belge kesme, kartla online tahsilat, toptancı XML çekme, kur güncelleme (son bilinen kur kullanılır ve ekranda "çevrimdışı kur" rozeti görünür).

### 7.2. Senkronizasyon davranışı

- Bağlantı gelince kuyruk otomatik gönderilir; kullanıcıya "3 satış, 2 servis senkronize edildi" bildirimi düşer.
- Çakışmalarda finansal olmayan alanlar otomatik birleştirilir; finansal/stok çakışmaları **çakışma gelen kutusuna** düşer ve yetkili kullanıcı karar verir.
- Resmi belge numaraları (fatura vb.) yalnız online üretilir; offline satışlar "belgesi sonra kesilecek" durumuyla işaretlenir.

### 7.3. Donanım köprüsü

Masaüstü istemci; termal yazıcı, A4 yazıcı, etiket yazıcı, barkod okuyucu, ÖKC, para çekmecesi ve müşteri ekranı ile konuşan lokal donanım servisine sahiptir. Web paneli aynı makinede masaüstü istemci çalışıyorsa yazdırmayı ona devredebilir.

---

## 8. UI/UX TASARIM SİSTEMİ — "KOMPAKT + TEKNOLOJİ HİSSİ"

ByteNova klasik "10 yıllık muhasebe programı" gibi görünmez; modern bir teknoloji ürünü gibi hissettirir. Ancak gösteriş hızın önüne asla geçmez.

### 8.1. Tasarım ilkeleri

1. **Kompakt yoğunluk:** Veri tabloları sıkı satır aralıklı; "Rahat / Kompakt" yoğunluk anahtarı vardır. Ekranda kaydırmadan maksimum bilgi.
2. **Tam responsive:** Aynı panel; telefonda, tablette, masaüstü tarayıcıda ve masaüstü uygulamasında kırılmadan çalışır. Mobilde sol menü alt sekmelere/hamburger'e dönüşür, tablolar kart görünümüne çözülür.
3. **Klavye birinci sınıf:** `Ctrl+K` global komut paleti (ara + eylem çalıştır: "yeni servis", "TN-2026-00342", "0532..."), `F2` hızlı satış, kısayol rehberi `?` ile açılır.
4. **Karanlık tema varsayılan, aydınlık tema seçenekli.** Elektronik dükkânı estetiğine uygun koyu arka plan + neon vurgu rengi (ByteNova mavisi/cyan).
5. **Teknoloji hissi veren efektler (ölçülü):**
   - Kart ve panellerde ince cam (glass) doku ve yumuşak gölge
   - Sayfa/durum geçişlerinde 150-250 ms mikro animasyonlar
   - Sayaçlarda animasyonlu rakam akışı (günlük ciro dolarken)
   - Servis durum değişiminde kanban kartının akıcı taşınması
   - Yüklenme durumlarında spinner değil **skeleton** ekranlar
   - Barkod okutulduğunda kısa "tarama" parlaması
   - Tüm animasyonlar 60 fps hedefler ve `prefers-reduced-motion` ile kapanır
6. **Boş ekran yoktur:** Her boş liste; ne işe yaradığını anlatan illüstrasyon + "İlk kaydını oluştur" eylemi gösterir.
7. **Üç tıklama kuralı:** Günlük operasyondaki hiçbir işlem (satış, servis kabul, tahsilat) 3'ten fazla ekran değiştirmeyi gerektirmez.
8. **Hata dili insancadır:** `SQLSTATE[23000]` yerine "İşlem tamamlanamadı. Stok kaydı güncellenemedi. Tekrar deneyin." Teknik detay yönetici log ekranındadır.

### 8.2. Ana yerleşim

**Sol navigasyon (daraltılabilir, ikon+etiket):** Bölüm 10'daki tam menü ağacı.

**Global üst bar:**
- Global arama / komut paleti (`Ctrl+K`)
- `+ Yeni` hızlı ekle menüsü (Müşteri, Servis, Satış, Alış, Teklif, Ürün, Tahsilat, Gider)
- **Döviz kuru göstergesi** (canlı USD/EUR — tıklayınca kur paneli ve "fiyatları güncelle" kısayolu)
- Bağlantı/senkron durumu rozeti (Online • Senkronize / Çevrimdışı • 4 bekleyen)
- Bildirim zili
- Şube seçici
- Kullanıcı menüsü

### 8.3. Mobil davranış

- Alt sekme çubuğu: Genel Bakış, Servisler, Satış, Ara, Menü
- Servis kabulde telefon kamerası: cihaz fotoğrafı, barkod/seri no okutma
- Parmakla müşteri imzası alma (teslim tutanağı)

---

## 9. FEATURE FLAG VE "ÇOK YAKINDA" SİSTEMİ

Ürün stratejisinin bilinçli kararı: **panele girildiğinde tüm modüller menüde görünür** — aktif olsun ya da olmasın.

### 9.1. Davranış

- Henüz tamamlanmamış modüller menüde normal yerinde durur; yanında zarif bir `YAKINDA` rozeti taşır.
- Tıklanınca modülün **tanıtım ekranı** açılır: ne yapacağı, örnek ekran görseli, "Hazır olunca haber ver" butonu (tıklayan kullanıcılar lansmanda bildirim alır — talep ölçümü de yapılmış olur).
- Pakete bağlı kilitli modüller `PRO` / `BUSINESS` rozeti taşır ve yükseltme ekranına götürür.
- Rozet renkleri tasarım sisteminde tanımlıdır: `YAKINDA` (gri-cyan), `YENİ` (yeşil, lansmandan sonra 30 gün), `BETA` (amber), `PRO` (mor).

### 9.2. Teknik model

- Her modül ve alt özellik bir **feature flag** ile tanımlanır: `off | coming_soon | beta | on`.
- Flag'ler tenant + plan + rol bazında çözülür; sunucudan gelir, istemcide önbellenir.
- Menü tek kaynaktan (feature registry) üretilir; böylece menü ile yetki ve flag asla birbirinden kopmaz.

---

## 10. NAVİGASYON — TAM MENÜ AĞACI

Aşağıdaki ağaç 1.0 lansmanında **eksiksiz görünür**; sağdaki sütun lansman durumunu belirtir.

| Menü | Alt öğeler | Lansman durumu |
|---|---|---|
| **Genel Bakış** | Dashboard, Akıllı özet | AKTİF |
| **Servisler** | Servis listesi, Kanban, Yeni servis, Dış servisler, Kargo takibi, Teslim alınmayanlar | AKTİF (Dış servis/Kargo: YAKINDA) |
| **Satış** | Hızlı satış (POS), Satışlar, İadeler, Fiyat listeleri | AKTİF |
| **Alış** | Alış faturaları, Satın alma talepleri, Toptancı fiyatları (XML) | AKTİF (XML: YAKINDA) |
| **PC Toplama** | Reçeteler (BOM), Toplama emirleri, Demontaj | YAKINDA (P1) |
| **Stok** | Ürünler, Stok hareketleri, Depolar, Sayım, Transferler, Uyumluluk | AKTİF (Uyumluluk: YAKINDA) |
| **Cihazlar** | Cihaz envanteri, Seri no sorgu, İkinci el havuzu | AKTİF |
| **Müşteriler** | Müşteri listesi, Cariler, Mutabakat | AKTİF (Mutabakat: YAKINDA) |
| **Tedarikçiler** | Tedarikçi listesi, Performans | AKTİF |
| **Teklifler** | Teklif listesi, Şablonlar | AKTİF (P1'de tam) |
| **Sözleşmeler** | Bakım sözleşmeleri, SLA takibi | YAKINDA (P1) |
| **Finans** | Kasa, Tahsilatlar, Giderler, Çek/Senet, POS mutabakat, Kur yönetimi | AKTİF (Çek/Senet ve POS mutabakat: P1) |
| **Belgeler** | Faturalar, e-Belge kutusu, Gider pusulaları, İrsaliyeler | AKTİF (e-belge entegrasyonu: P1) |
| **Raporlar** | Satış, Kârlılık, Servis, Stok, Personel/Prim, Muhasebeci paketi | AKTİF (Prim: P1) |
| **Pazaryeri** | Trendyol, Hepsiburada, N11 senkron | YAKINDA (P2) |
| **Bildirimler** | Bildirim merkezi, Mesaj şablonları, İYS yönetimi | AKTİF (İYS: P1) |
| **Ayarlar** | İşletme, Şubeler, Kullanıcılar/Roller, Vergi kuralları, e-Belge, ÖKC, Yazıcılar, Entegrasyonlar, İçe/Dışa aktarma, Yedekleme | AKTİF |

---

# BÖLÜM III — ÇEKİRDEK MODÜLLER

## 11. DASHBOARD

Ana ekran işletmenin "bugünkü durumu"nu gösterir; role göre kişiselleşir (teknisyen ciroyu görmek zorunda değildir, teknisyenin de tüm maliyet detayını sahibi görmeyebilir).

Kartlar:

- Bugünkü satış / tahsilat / **net nakit** (giderler düşülmüş)
- Açık servisler, bugün teslim edilecekler, onay bekleyenler, gecikenler
- **Bugünkü kur ve kur etkisi** ("Kur %1,8 arttı — 34 ürünün fiyatı güncellenmeli")
- Kritik stoklar
- **Vadesi gelen çekler/senetler** ve bugün beklenen POS geçişleri
- Bekleyen kapora/avanslar
- **Teslim alınmayan cihaz uyarıları** ("3 cihaz 60 günü aştı")
- Bugünkü kâr tahmini (maliyet yöntemi seçilebilir)
- Personel performansı

### Akıllı ana sayfa
Dashboard statik rapor değildir; sabah şunları söyleyebilir:

> "Bugün teslim edilmesi gereken 7 servis var." • "3 servis müşteri onayı bekliyor." • "4 ürün kritik stokta." • "Yarın vadesi gelen 2 çek toplamı 45.000 TL." • "Bu ay servis geliri geçen aya göre %18 arttı."

Bu katman zamanla analitik/AI özelliklerine dönüşür (Bölüm 39-AI notu: AI karar verici değil yardımcıdır).

---

## 12. SERVİS YÖNETİMİ — ÜRÜNÜN KALBİ

### 12.1. Servis kaydı oluşturma

1. Müşteri aranır veya oluşturulur.
2. Cihaz türü, marka/model, seri no/IMEI girilir.
3. Fiziksel durum işaretlenir + fotoğraflanır (çizik, kırık ekran vb. servis kaydının parçasıdır).
4. Müşteri beyanı yazılır.
5. Aksesuarlar tek tek kaydedilir (laptop + adaptör + çanta); kapanışta "adaptör teslim edildi mi?" kontrolü yapılır.
6. Cihaz türüne göre dinamik kabul checklist'i doldurulur (laptop: ekran, klavye, touchpad, portlar, kamera, hoparlör, kasa, vida durumu…; telefon: ekran, kamera, biyometri, şarj, SIM…).
7. **Veri ve risk beyanları onaylatılır** (bkz. 12.8).
8. Gerekiyorsa **kapora/avans** alınır (bkz. 12.6).
9. Tahmini ücret/ücretli teşhis koşulu belirlenir.
10. Servis numarası üretilir: `BN-2026-000184`; barkod/QR etiket basılır.

### 12.2. Servis durum makinesi

`Kabul Edildi → İnceleme Bekliyor → İncelemede → Fiyatlandırma Bekliyor → Müşteri Onayı Bekliyor → Onaylandı → Onarılıyor → Test Ediliyor → Hazır → Teslim Edildi`

Ara/alternatif durumlar: `Parça Bekleniyor`, `Dış Serviste`, `Kargoda (Geliş/Dönüş)`, `İptal`, `Onarılamadı`, `Müşteri Vazgeçti`, `Garanti Kapsamında`, `Teslim Alınmadı (Bekliyor)`, `Hurda / Parça İçin Ayrıldı`.

Her durum değişimi geçmişe yazılır: önceki durum, yeni durum, kullanıcı, tarih, açıklama. Bir servis aynı anda iki aktif ana duruma sahip olamaz.

### 12.3. Onay akışı

**Teknisyen teşhisi → Teklif → Müşteri onayı → Onarım → Test → Teslim**

Teknisyen "anakart değişmeli, 4.800 TL" dediğinde sistem doğrudan satış yaratmaz; onay tarih/saat/kanal/kullanıcı ile kaydedilir. Onay kanalları: yüz yüze imza, SMS/WhatsApp linkinden onay, telefon (personel beyanlı — "14:32 arandı, onay verdi" notu iletişim geçmişine düşer).

### 12.4. Parça kullanımı ve stok entegrasyonu

Teknisyen servis kaydından parça seçtiğinde sistem:

1. Stoktan parçayı **rezerve eder**.
2. Servis maliyetine ekler (dövizli maliyet, günün kuru ile TL karşılığı).
3. Müşteri fiyatını oluşturur.
4. Müşteri onayını bekler.
5. Onaydan sonra stok çıkışı yapar ve satış/fatura kalemiyle ilişkilendirir.

Stokta parça yoksa `Parça Bekleniyor` durumu + satın alma talebi (`PR-00057`) oluşur; parça gelince alış → stok girişi → servis ilişkisi otomatik bağlanır.

**Müşterinin getirdiği parça:** Stok dışı "müşteri parçası" olarak işlenir; işçilik faturalanır, parça garanti kapsamı dışı beyanı otomatik eklenir.

**Sökülen parça takibi:** Değiştirilen arızalı parçanın akıbeti zorunlu alandır: `Müşteriye teslim edildi / Dükkânda imhaya ayrıldı / Hurda-parça stoğuna alındı`. Tüketicinin sökülen parçayı isteme hakkı vardır; teslim tutanağına yansır.

### 12.5. Dış servis ve kargo

- **Dış servis:** Cihaz anlaşmalı üst servise (kart tamiri, yetkili servis) gönderilebilir. Dış servis sağlayıcısı tedarikçi olarak tanımlanır; gönderim tarihi, beklenen dönüş, maliyet ve durum (`Dış Serviste`) izlenir. Dış servis maliyeti servis kârlılığına işlenir.
- **Kargo ile servis:** Şehir dışı müşteri cihazı kargoyla gönderir. Kargo firması, takip no, yön (geliş/dönüş), ödeme tipi (karşı ödemeli) kaydedilir. Kargo entegrasyonları (Yurtiçi, Aras, MNG, PTT) sağlayıcı soyutlamasıyla eklenir (P1/P2).
- **Yerinde servis:** Kurumsal müşteriye sahada bakım; adres, teknisyen, yol/servis ücreti kalemi desteklenir.

### 12.6. Kapora / avans

Pahalı parça siparişi öncesi müşteriden avans alınabilir:

- Avans servise bağlı tahsilat olarak kaydedilir, kasaya işlenir.
- Teslimde toplam tutardan otomatik mahsup edilir.
- Müşteri vazgeçerse avans iade/irat kararı yetkili onayı + audit ile verilir.
- Servis formunda ve teslim belgesinde avans satırı görünür.

### 12.7. Teslim alınmayan cihazlar

Gerçek hayatın kaçınılmazı: müşteri cihazı bırakır, gelmez.

- Teslimden itibaren tanımlı süre geçince cihaz `Teslim Alınmadı (Bekliyor)` durumuna düşer.
- Kademeli hatırlatma planı çalışır: gün 15 SMS → gün 30 arama görevi → gün 60 yazılı ihtar şablonu (iadeli taahhütlü için hazır PDF).
- İşletme tanımlı **bekleme/depolama ücreti** işletilebilir (kabul formunda beyan edilmişse).
- Süre sonunda elden çıkarma/hurdaya ayırma kararı; tüm bildirim geçmişi kanıt olarak dosyada saklanır.
- Dashboard'da "teslim alınmayanlar" sayacı görünür.

### 12.8. Veri ve risk beyanları (kabul formu şablonları)

Servis kabul onay metni, yönetilebilir şablonlardan oluşur; tipik maddeler:

- "Cihazdaki veriler yedeklenmemiştir; veri kaybından işletme sorumlu tutulamaz." (müşteri isterse ücretli yedekleme hizmeti satılabilir — satış kalemi olarak)
- "Sıvı temaslı / fiziksel hasarlı cihazlarda işlem sonrası çalışma garantisi verilmez."
- Bekleme ücreti ve teslim alınmayan cihaz koşulları
- KVKK aydınlatma metni referansı

Şablonlar işletmenin hukukçusu tarafından düzenlenebilir; sistem örnek metni dayatmaz, versiyonlar.

### 12.9. Servis garantisi ve tekrar servis

Teslimden sonra aynı arıza kısa sürede tekrar gelirse yeni kayıt açılır ama ilişki kurulur: `BN-2026-000221 → Kaynak servis: BN-2026-000155`. Garanti kapsamındaki onarımda geçen süre garanti süresine eklenir; garanti kapsamındaki onarımda **azami tamir süresi (20 iş günü)** sayaç olarak izlenir ve yaklaşınca uyarır.

### 12.10. Ücretli teşhis

Müşteri teklifi reddederse ("7.500 TL vermem, geri alacağım"): onay durumu reddedilir, teşhis raporu saklanır, cihaz teslim bekleyen duruma geçer, önceden tanımlı kurala göre ücretli teşhis bedeli ayrı kalem olarak gösterilir, müşteriye hazır mesaj üretilir.

### 12.11. Servis formu içeriği

İşletme bilgileri, servis no, müşteri, cihaz, seri no, fiziksel durum, aksesuarlar, müşteri beyanı, personel notları, yapılan işlemler, kullanılan parçalar (sökülen parça akıbeti dahil), işçilik, avans/mahsup, toplam, garanti/teslim notları, beyan metinleri, tarih, imzalar, QR doğrulama kodu. QR ile müşteri servis durum sayfasına ulaşabilir (P1).

---

## 13. TEKNİSYEN EKRANI

Teknisyen giriş yaptığında: bana atanan servisler, öncelikli işler, parça bekleyenler, bugün test edilecekler, teslime hazır cihazlar.

Servis detayında üç sütun: solda cihaz fotoğrafı + müşteri + cihaz bilgisi; ortada arıza, teşhis, yapılan işlemler, kullanılan parçalar; sağda durum, süre, onay, maliyet, ödeme bilgisi (yetkisi varsa).

Teknisyen teknik not yazar:

> "Cihaz termal macun kuruması nedeniyle yüksek sıcaklıkta çalışıyordu. Fan temizliği yapıldı, termal macun yenilendi. FurMark ve MemTest başarılı."

Öncelik sistemi: Düşük / Normal / Yüksek / Acil — acil servisler dashboard'da ayrı görünür. Kanban görünümü: Kabul | İnceleme | Onay | Onarım | Test | Hazır sütunları; kartta cihaz, müşteri, teknisyen, geçen süre, öncelik, tahmini tutar.

---

## 14. SATIŞ YÖNETİMİ

### 14.1. Hızlı satış (POS)

`F2 → ürün ara/barkod okut → Enter → miktar → iskonto → ödeme → belge tipi → tamam`

Klavye ağırlıklı, 3 ekranı geçmeyen akış. Barkodsuz ürün için hızlı arama; tanımsız kalem için "serbest satır" (yetkiye bağlı).

### 14.2. Satış türleri ve kalemleri

Perakende, kurumsal, servisle ilişkili, paket, parça, işçilik, cihaz ve **dijital ürün** satışı.

Tek satışta karma kalemler: `SSD 1 TB — 3.250 TL` + `Montaj — 500 TL` + `Windows kurulumu — 750 TL`.

**Dijital ürün (lisans key):** Stok adedi yerine key havuzu; satışta key rezerve edilir, belgeye/e-postaya yazılır, kullanılan key müşteriye bağlanır.

### 14.3. İskonto ve yuvarlama

- Satır iskontosu (% veya tutar) + genel toplam iskontosu + "küsuratı sil" yuvarlama butonu.
- İskonto yetki limiti rol bazlıdır; limit aşımı yönetici onayı ister (PIN/parola ile yerinde onay).
- Tüm iskontolar audit'e ve kârlılık raporuna işlenir.

### 14.4. Fiyat listeleri ve KDV dahil/hariç

- Ürün fiyatı **tek alan değildir**: Perakende (KDV dahil), Bayi/Toptan (KDV hariç), Kurumsal ve müşteriye özel fiyat listeleri.
- Her fiyat listesinin dahil/hariç modu tanımlıdır; ekranlar ve belgeler doğru modda gösterir.
- Etiket basımı TL ve KDV dahil fiyatla yapılır (etiket mevzuatına uygun).
- Fiyat listeleri dövizli kurala bağlanabilir: "Perakende = (USD maliyet × kur × 1,25) yukarı yuvarla".

### 14.5. Taksit ve ödeme

- Kart ödemesinde taksit seçimi; ürün grubuna göre **taksit limiti kural motorundan** doğrulanır (elektronikte sınır, telefonda tutara göre değişen kural — parametrik).
- Taksit sayısına göre vade farkı tablosu uygulanabilir.
- Karma ödeme: 5.000 TL satış = 2.000 nakit + 3.000 kart.
- POS komisyon oranı ödeme kaydına işlenir → net kârlılıkta görünür.

### 14.6. Belge tipi seçimi

Satış kapanışında: **ÖKC Fişi / e-Arşiv Fatura / e-Fatura / Sonra kesilecek**. Kurumsal satışta vergi no/TCKN zorunluluğu, tevkifat gerekiyorsa otomatik uygulanır (Bölüm 38). e-Arşiv zorunluluk eşiği kural motorundan kontrol edilir ("bu tutar üstü fatura kesilmeli" uyarısı).

### 14.7. İadeler

`İade Alındı → Kontrol → Yeniden Satılabilir / Arızalı / Hurda / Servise`

- Orijinal satış ilişkisi zorunlu; para iadesi/mahsup seçimi.
- Müşteri mükellefse iade faturası beklenir; değilse iade belgesi düzenlenir — belge yönlendirmesini sistem yapar.
- Mesafeli/online satışta 14 günlük cayma hakkı akışı ayrı kurallarla işler (pazaryeri modülüyle birlikte P2'de tam).

---

## 15. ALIM YÖNETİMİ

### 15.1. Alış kaydı

Tedarikçiden 5 SSD + 3 RAM + 2 laptop alındığında: tedarikçi, belge no/tarihi, **para birimi ve kur**, birim fiyat, KDV, masraf dağıtımı (kargo/komisyon maliyete yedirilebilir), seri numaraları, stok girişi, ödeme durumu (peşin/çek/açık hesap) kaydedilir.

- **Geriye dönük belge girişi:** Belge tarihi ile kayıt tarihi ayrı tutulur; akşam toplu fatura girişi meşru bir akıştır.
- Alış fiyatı değişimi ürün kartındaki son alış/ortalama maliyeti günceller ve fiyat kuralı varsa satış fiyatı önerisini tetikler.

### 15.2. Toptancı XML/B2B entegrasyonu (P1)

Türkiye'deki fiili standart: distribütör B2B'sinden stok-fiyat çekme.

- Sağlayıcı soyutlaması: `SupplierFeedProvider` (Penta, Index/Datagate, Arena, Armada, Oksid… her biri adaptör).
- Akış: XML/API çek → kendi ürün kartlarıyla eşleştir (barkod/parça no) → kâr kuralı uygula → satış fiyatı güncelle → "toptancıda var, bende yok" fırsat listesi.
- Toptancı stok durumu satış ekranında görünebilir: "Stoğumda yok, Penta'da 12 adet — bugün sipariş verilirse yarın teslim".

### 15.3. Konsinye mal

Toptancıdan konsinye alınan ürün "stokta ama mülkiyet dışı" bayrağıyla izlenir; satılınca tedarikçiye borçlaşma oluşur, iade edilirse konsinye çıkışı yapılır. Konsinye stok, stok değer raporunda ayrı gösterilir.

### 15.4. Satın alma talepleri

Servisten veya kritik stok uyarısından doğan talepler (`PR-xxxxx`) toplanır, tedarikçiye siparişe dönüşür, gelen mal talep/servisle otomatik ilişkilenir.

---

## 16. PC TOPLAMA VE ÜRETİM (BOM)

Bilgisayarcının klasik işi birinci sınıf modüldür.

### 16.1. Reçete (BOM)

"Oyun PC'si — Orta Segment" gibi şablon reçeteler: kasa, anakart, CPU, RAM ×2, SSD, PSU, ekran kartı + montaj işçiliği + işletim sistemi lisansı.

### 16.2. Toplama emri

1. Reçete seçilir veya serbest parça listesi oluşturulur (müşteriye özel toplama).
2. Parçalar stoktan rezerve edilir; seri numaralı parçaların hangi seri no'ları kullanıldığı kaydedilir.
3. Montaj + test checklist'i (POST, stres testi, sıcaklık) tamamlanır.
4. Sistem **yeni bir ürün/cihaz kaydı** oluşturur: toplama PC'ye kendi seri no'su verilir; maliyeti = parçaların dövizli maliyeti + işçilik.
5. Cihaz satışa hazır stoğa girer; satılınca içindeki her parçanın izi korunur ("Bu PC'deki ekran kartı hangi alıştan geldi?" sorusu cevaplanabilir).

### 16.3. Demontaj ve parça hasadı

- Satılmayan toplama PC parçalarına ayrılıp stoğa geri alınabilir (maliyetler geri dağıtılır).
- Hurdaya ayrılan/teslim alınmayan cihazlardan sökülen sağlam parçalar "ikinci el parça" olarak ayrı stok kategorisinde stoğa alınabilir (tahmini değerle, audit'li).

---

## 17. STOK YÖNETİMİ

### 17.1. Ürün kartı

Ürün adı, SKU, barkod(lar), marka, kategori, birim, **alış para birimi + alış fiyatı**, ortalama maliyet, son alış maliyeti, fiyat listesi bağlantıları, KDV oranı, min/kritik stok, depo, raf, seri no zorunluluğu, garanti süresi kuralı, tedarikçi(ler), **uyumluluk bilgisi**, muadil/OEM ilişkisi, konsinye bayrağı, aktif/pasif.

**Uyumluluk matrisi (P1):** "Bu panel şu laptop modelleriyle uyumlu", "bu RAM şu anakartlarla çalışır" — servis hızını doğrudan etkiler; muadil parça önerisi servis ekranında görünür.

### 17.2. Stok hareketleri

Her hareket bir kayda bağlıdır: Alış, Satış, Servis kullanımı, İade, Transfer, Sayım farkı, Hurda, **Toplama (BOM) girişi/çıkışı**, **Demontaj**, Konsinye giriş/çıkış, Manuel düzeltme.

> 12 → 11, neden: Servis #BN-2026-00184, kullanıcı: Ahmet, tarih: 14.08.2026

Manuel düzeltme audit'siz yapılamaz.

### 17.3. Negatif stok politikası

Gerçek hayat: mal öğlen satılır, faturası akşam girilir. ByteNova bunu yasaklamaz, **yönetir**:

- Tenant ayarı: `Negatif stoğa izin ver (uyarılı) / yönetici onayıyla izin ver / yasakla`.
- Negatif satılan ürün "belgesi bekleniyor" listesine düşer; alış girilince maliyet geriye dönük eşleşir.
- Negatif stok raporu dashboard uyarısıdır.

### 17.4. Sayım

Sayım başlat → stok snapshot → personel fiili miktar girer (barkodla hızlı sayım) → farklar → yönetici onayı → düzeltme hareketi + audit.

---

## 18. CİHAZ ENVANTERİ

Ürün ile cihaz ayrıdır: aynı modelden 10 laptop, seri numarasıyla 10 ayrı fiziksel varlıktır.

Cihaz geçmişi: **Tedarikçi → Alış → Depo → (Toplama) → Satış → Müşteri → Garanti → Servis → İade → (İkinci el havuzu)**

Seri numarası aynı tenant içinde çakışamaz; seri no basit metin alanı değil, indeksli ve aranabilir birincil izleme anahtarıdır. Global aramaya seri no yazıldığında cihazın tüm yaşamı çıkar. MAC adresi ve IMEI (telefon dikeyinde) ek kimlik alanlarıdır.

---

## 19. İKİNCİ EL / YENİLENMİŞ CİHAZ OPERASYONU

### 19.1. Cihaz alımı

Müşteri eski laptopunu satmak istediğinde: müşteri, cihaz, seri no, fiziksel durum, test sonucu, alış fiyatı, tahmini satış fiyatı, giriş tarihi kaydedilir.

**Belge tarafı (Türkiye gerçeği):**

- Vergi mükellefi olmayan şahıstan alımda sistem **gider pusulası** üretir (PDF + imza alanı + gerekli alanlar); stopaj/istisna parametreleri kural motorundadır.
- Mükelleften alımda alış faturası beklenir.
- Alım belgesi cihaz kaydına bağlanır — "bu cihaz nereden geldi?" sorusunun yasal cevabı dosyadadır.

### 19.2. Test raporu

CPU, RAM, disk sağlığı (SMART), ekran, klavye, batarya sağlığı (%), USB, kamera, mikrofon, Wi-Fi, Bluetooth. Rapor müşteriye gösterilebilir çıktıdır (ikinci el satışta güven aracı).

### 19.3. Yaşam döngüsü ve satış

`Alındı → Test Edildi → Yenileniyor → Satışa Hazır → Satıldı`

- Yenileme sırasında kullanılan parçalar cihaz maliyetine eklenir.
- Satışta **KDV özel matrah** senaryosu desteklenir (mükellef olmayandan alınan ürünün satışında KDV'nin fark üzerinden hesabı) — kural motoru parametresiyle, belgeye doğru yansır.
- **Yenilenmiş ürün mevzuatı:** Cep telefonu/tablet dikeyinde "yenilenmiş" ibaresiyle satış, yetkili yenileme merkezi belgesine bağlıdır. İşletme profili faaliyet türü doğrulanmadan sistem "yenilenmiş" etiketi basmaz; onun yerine "ikinci el" akışı sunar. Hukuki durum işletme beyanıdır, sistem varsayım yapmaz.

---

## 20. MÜŞTERİ YÖNETİMİ — CRM

Müşteri kartı: ad soyad/unvan, telefon(lar), e-posta, adres(ler), vergi bilgileri (TCKN/VKN, vergi dairesi — e-belge için), müşteri tipi (bireysel/kurumsal), fiyat listesi ataması, **İYS izin durumları** (arama/SMS/e-posta ayrı ayrı), notlar, iletişim geçmişi, satın alımlar, servis geçmişi, cari bakiye, cihazları.

### Müşteri 360°

> 14 satış • 3 servis • 2 cihaz • 18.450 TL toplam alışveriş • 1 açık servis • 2.000 TL bekleyen tahsilat • 1 vadesi yaklaşan çek

### İletişim geçmişi

> "14:32 müşteriye fiyat iletildi." • "14:44 müşteri onay verdi." • "17:02 SMS gönderildi."

"Ben size söylemiştim" ihtilaflarını bitirmek hedeftir.

---

## 21. KASA VE TAHSİLAT

### 21.1. Tahsilat yöntemleri

Nakit, kredi kartı (taksitli/taksitsiz), banka transferi/EFT, **çek**, **senet**, açık hesap, **avans mahsubu**, karma ödeme, sanal POS/ödeme linki (P2 — uzaktan tahsilat).

### 21.2. POS gerçeği

- Kart tahsilatında banka/POS cihazı seçilir; komisyon oranı ve **hesaba geçiş günü** tanımlıdır.
- **POS mutabakat ekranı (P1):** Gün sonu POS toplamı ↔ ertesi gün banka hesabına geçen tutar eşleştirilir; komisyon kesintileri gider olarak otomatik işlenir.

### 21.3. Kasa kapanışı

Gün sonunda: beklenen nakit, fiili nakit, kart toplamı (POS bazında), havale, çek girişi, gider çıkışları, fark. Fark açıklaması zorunlu + audit. Z raporu referansı eklenebilir (SMMM paketi için).

---

## 22. ÇEK VE SENET PORTFÖYÜ (P1)

- **Alınan çekler:** Müşteriden alınan çek; keşideci, banka, vade, tutar. Durumlar: `Portföyde → Bankaya verildi (tahsile) → Tahsil edildi / Karşılıksız` veya `Ciro edildi` (tedarikçiye verilen müşteri çeki — ciro zinciri izlenir).
- **Verilen çekler:** İşletmenin toptancıya yazdığı çekler; vade takibi, "önümüzdeki 30 günde çıkacak çekler" nakit akış uyarısı.
- Senet aynı modelde desteklenir.
- Vade takvimi dashboard'a ve nakit akış projeksiyonuna beslenir.
- Karşılıksız çek durumu cariye ve müşteri risk notuna işlenir.

---

## 23. CARİ / BORÇ-ALACAK

- Kurumsal müşteri ay sonu ödemeli çalışabilir: 3 laptop bakımı + 2 SSD + 1 kurulum → açık hesap → vade takibi.
- **Dövizli cari:** Toptancı carisi USD tutulabilir; ödeme anında kur farkı hesaplanır, kur farkı kaydı/faturası üretilebilir.
- Vade farkı/gecikme kuralı tanımlanabilir (uygulamak işletmenin kararıdır, sistem hesaplar).
- **Ekstre ve mutabakat (P1):** Dönemsel cari ekstre PDF'i tek tıkla müşteriye/tedarikçiye gönderilir; mutabakat cevabı kaydedilir.
- **Açılış bakiyeleri:** Devir sırasında cari açılış bakiyesi (borç/alacak, dövizli olabilir) import edilir — eski defterdeki alacaklar kaybolmaz.

---

## 24. GİDER YÖNETİMİ

"Bugünkü kâr" gerçek olacaksa giderler sistemde olmalıdır.

- Gider kategorileri: kira, elektrik/su/internet, maaş, yemek, kargo, POS komisyonu (otomatik), dış servis, sarf, vergi/harç, diğer.
- Gider girişi 10 saniyelik akıştır: `+ Yeni → Gider → kategori → tutar → kasa/banka → kaydet`; fotoğrafla fiş ekleme.
- Tekrarlayan giderler (kira her ayın 1'i) otomatik hatırlatılır.
- Raporlarda brüt kâr ↔ **giderler düşülmüş işletme kârı** ayrımı net gösterilir.
- Gider belgeleri SMMM paketine dahildir.

---

## 25. TEKLİF YÖNETİMİ

`Taslak → Gönderildi → Müşteri İnceliyor → Kabul → Reddedildi → Süresi Doldu`

- Tekliften satış, servis işi veya sipariş oluşturulur; kabulde iş emri otomatik başlayabilir.
- Kurumsal örnek: "10 ofis bilgisayarı + kurulum + ağ yapılandırması".
- Dövizli teklif: "fiyatlar X kuru üzerindendir, N gün geçerlidir" koşulu; süre dolunca güncel kurla yenileme önerisi.
- Teklif PDF'i şablonludur, QR ile online görüntüleme/onay (P1).

---

## 26. TEDARİKÇİ YÖNETİMİ

Tedarikçi kartı: firma, yetkili, telefon, e-posta, vergi bilgileri, IBAN, **çalışma para birimi**, son alış, toplam alış, borç (dövizli olabilir), verilen çekler, ürünler, XML feed bağlantısı, dış servis sağlayıcı bayrağı.

Performans raporları: en çok alınan ürünler, ortalama maliyet ve fiyat değişim grafiği, teslimat süresi, iade oranı.

---

## 27. PERİYODİK BAKIM SÖZLEŞMELERİ (P1)

Kurumsal gerçek: okul/şirketle aylık bakım anlaşması.

- Sözleşme: kapsam (cihaz sayısı/listesi), periyot, aylık bedel, SLA (müdahale süresi), başlangıç/bitiş, otomatik faturalama günü.
- Periyodik bakım ziyaretleri plan olarak üretilir; teknisyene görev düşer; ziyaret raporu müşteriye gider.
- Sözleşme bitişi 30 gün önce hatırlatılır (yenileme fırsatı).
- Sözleşme kapsamı içi/dışı işler ayrışır: kapsam dışı iş normal ücretli servise dönüşür.
- Toplu iş emri: 15 bilgisayar tek müşteri altında alt servisler (`BN-001…015`) olarak izlenir; faturalanabilir toplam tek yerde görünür.

---

## 28. GARANTİ TAKİBİ

- Yeni ürün satışında: satın alma tarihi, teslim tarihi, garanti başlangıcı/bitişi, seri no, garanti belgesi referansı.
- Garanti süresi ürün/işlem kurallarından hesaplanır; "her ürün 2 yıl" sabiti kullanılmaz — süreler ürün grubuna ve mevzuata göre kural motorundadır. Onarımda geçen süre garantiye eklenir.
- Garanti belgesi üretici/ithalatçı sorumluluğundadır; satıcı tüketiciye ulaşmasını sağlar. Fatura/fiş tek başına garanti belgesi yerine geçmez — sistem bu ayrımı belge yönetiminde korur.
- İşletme profili faaliyet türü: Normal satıcı / Teknik servis / Yetkili servis / Üretici-ithalatçı / Yenileme merkezi. Belge/izin durumu kullanıcı beyanıdır; sistem varsayımla statü vermez.
- Garantili cihaz servise gelirse sistem uyarır: "Bu cihaz üretici garantisi kapsamında olabilir — yetkili servise yönlendirme müşteriye önerilsin mi?" Karar ve müşteri tercihi kayda geçer.

---

## 29. PERSONEL VE PRİM (P1)

- Satış primi: satışçıya ciro/kâr bazlı oran; teknisyen primi: kapanan servis başına veya işçilik cirosu üzerinden.
- Prim kuralları tenant tanımlıdır; dönem sonunda prim raporu üretilir (bordroya veri sağlar, bordro tutmaz).
- Performans panoları: teknisyen başına kapanan servis, ortalama süre, tekrar gelme oranı; satışçı başına ciro/kârlılık.
- Basit vardiya/devam notları (tam puantaj sistemi hedeflenmez).

---

## 30. BELGE MOTORU

Tüm resmi ve operasyonel belgeler tek motor üzerinden üretilir, numaralanır, arşivlenir:

**Resmi belgeler:** ÖKC fiş referansı, e-Fatura, e-Arşiv fatura, e-İrsaliye/irsaliye, iade faturası, **gider pusulası**, tevkifatlı fatura, kur farkı faturası.

**Operasyonel belgeler:** Servis kabul formu, teslim tutanağı, teklif, cari ekstre, mutabakat mektubu, ihtar şablonu, bakım ziyaret raporu, ikinci el test raporu, prim raporu, Z raporu kaydı.

Kurallar:

- Belge şablonları özelleştirilebilir (logo, alt bilgi, koşul metinleri) ve versiyonlanır.
- Resmi belge numaraları yalnız online üretilir; offline işlemler "belge bekliyor" kuyruğundadır.
- Her belge ilişkili kayda (satış/servis/alış/cari) bağlıdır; ilişkisiz belge olamaz.
- Arşiv: belge PDF'leri + e-belge XML'leri saklama politikasına göre arşivlenir.

---

## 31. BİLDİRİMLER VE İYS

### 31.1. Bildirim merkezi

Servis kabul edildi, fiyat onayı gerekiyor, parça bekleniyor, servis tamamlandı, cihaz teslim alınabilir, ödeme gecikti, çek vadesi yaklaşıyor, garanti bitiyor, kritik stok, teklif süresi bitiyor, teslim alınmayan cihaz uyarısı, sözleşme yenileme, kur değişimi eşiği aşıldı.

Kanallar: uygulama içi, e-posta, SMS, WhatsApp — hepsi değiştirilebilir sağlayıcı (`SmsProvider`, `WhatsAppProvider`…) üzerinden.

### 31.2. Operasyonel ileti ↔ ticari ileti ayrımı (İYS)

- **Operasyonel:** "Cihazınız hazır" — hizmetin gereği, İYS kapsamı dışı.
- **Ticari/kampanya:** "SSD'lerde %20 indirim" — **İYS onayı olmayan müşteriye gönderilemez**; sistem göndermeden önce izin durumunu kontrol eder.
- Müşteri kartında kanal bazlı izin yönetimi; İYS entegrasyonu (P1) izinleri senkronize eder; ret bildirimleri anında işlenir.
- Kampanya gönderim ekranı izinli segmenti otomatik filtreler ve gönderim kanıtlarını saklar.

---

## 32. RAPORLAMA

### Satış
Günlük/aylık satış, ürün-marka-kategori bazlı, personel satışları, iskonto raporu (kim ne kadar iskonto yapmış), belge tipi dağılımı (fiş/fatura).

### Kârlılık
Brüt satış, ürün maliyeti (**maliyet yöntemi seçilebilir: ortalama / son alış / güncel kur ile yenileme**), işçilik geliri, dış servis maliyeti, POS komisyonu, iskonto etkisi, **giderler düşülmüş işletme kârı**, servis kârlılığı, kur farkı etkisi.

### Servis
Açık servisler, ortalama servis süresi, teknisyen performansı, en çok arızalanan cihazlar, tekrar gelen servisler, onay oranı, azami süre yaklaşanlar, teslim alınmayanlar.

### Stok
Kritik stok, hareketsiz stok, en hızlı dönenler, stok değeri (TL ve döviz bazlı, konsinye ayrımlı), depo bazlı, seri numaralı cihaz listesi, negatif stok raporu.

### Finans
Kasa hareketleri, nakit akış projeksiyonu (çek/senet vadeleri + beklenen POS geçişleri + tekrarlayan giderler), cari yaşlandırma (30/60/90 gün), tahsilat performansı.

### Muhasebeci paketi
Ay sonu tek tık: satış belgeleri, alış belgeleri, gider pusulaları, giderler, Z raporu kayıtları — Excel + Luca/Logo/Mikro/Zirve uyumlu formatlar. `AccountingProvider` soyutlamasıyla formatlar eklenebilir.

---

## 33. PAZARYERİ VE E-TİCARET (P2)

- Trendyol, Hepsiburada, N11, Amazon TR adaptörleri (`MarketplaceProvider`).
- Stok senkronu: dükkânda satılan ürün pazaryerinde de düşer (çift satış felaketinin önlenmesi).
- Pazaryeri siparişi ByteNova'da satış olarak görünür; komisyon gideri otomatik işlenir.
- Mesafeli satış/cayma hakkı iade akışı bu modülle tam devreye girer.
- Kendi sitesinden satış için basit ödeme linki (sanal POS sağlayıcı soyutlaması).

---

## 34. VERİ TAŞIMA / DEVİR (ONBOARDING)

Eski programdan/Excel'den geçiş bariyeri ciddiye alınır.

Import türleri: Müşteriler, Ürünler, Stok miktarları, Tedarikçiler, Cihazlar, **Cari açılış bakiyeleri (dövizli olabilir)**, **Açık servisler**, **Portföydeki çekler**.

Sihirbaz: `Dosya Yükle → Kolonları Eşleştir → Hataları Göster → Önizle → Aktar` — hatalı satırlar aktarımı bloklamaz, ayrı düzeltme listesine düşer. Yaygın programlardan (rakip bilgisayarcı yazılımları) hazır eşleştirme şablonları zamanla eklenir.

---

# BÖLÜM IV — MEVZUAT VE UYUM MİMARİSİ

## 35. E-BELGE MİMARİSİ

ByteNova muhasebe mevzuatını "belirleyen" değil, entegre eden sistemdir.

- e-Fatura, e-Arşiv, e-İrsaliye entegrasyon arayüzleri; **özel entegratör soyutlaması** (`InvoiceProvider` — entegratör değişince sistem yeniden yazılmaz).
- Belge durum sorgulama, başarısız belge/retry mekanizması, belge arşivleme.
- **Entegratörsüz mod (düşük teknoloji modu):** En küçük işletme entegratör kullanmaz, GİB portalden manuel keser. Akış: faturayı ByteNova'da oluştur → "portalde kesildi" işaretle → numarasını bağla. Böylece kayıt bütünlüğü entegrasyonsuz da korunur.
- Mükellef sorgulama: kurumsal satışta VKN girilince alıcının e-Fatura mükellefi olup olmadığı sorgulanır, belge tipi otomatik önerilir.
- Tasarım kuralı: vergi/e-belge kuralları koda gömülmez; tarihsel versiyonlu konfigürasyondan yönetilir (GİB 509 Sıra No.lu Tebliğ ve değişiklikleri referans).

## 36. ÖKC (YAZARKASA POS) ENTEGRASYONU

- `FiscalDeviceProvider` soyutlaması; Ingenico/Hugin/Profilo adaptörleri masaüstü donanım köprüsü üzerinden.
- Satış kapanışında tutar ÖKC'ye iletilir, fiş no ByteNova kaydına döner; banka POS'u ÖKC içindeyse kart işlemi aynı akışta.
- Entegrasyon yoksa manuel mod: "ÖKC fişi kesildi, no: ___".
- Z raporu kaydı gün sonunda kasaya ve SMMM paketine işlenir.

## 37. VERGİ KURALLARI MOTORU

Tek merkezi, tarih-versiyonlu kural motoru şunları yönetir:

- **KDV oranları** (ürün grubu bazlı, tarih aralıklı)
- **KDV tevkifatı** (kurumsal/kamu satış ve hizmetlerinde oran ve eşikler)
- **Özel matrah** (ikinci el satış senaryosu)
- **Gider pusulası** parametreleri (stopaj/istisna)
- **Taksit limitleri** (BDDK — ürün grubu + tutar bazlı)
- **e-Arşiv fatura zorunluluk eşikleri**
- **Garanti süreleri** (ürün grubu bazlı asgari süreler)
- Kuruş yuvarlama kuralları

Kural motoru güncellemeleri merkezi olarak yayınlanır (SaaS avantajı: mevzuat değişince tüm tenant'lara tek güncelleme); işletme kendi ek kurallarını tanımlayabilir.

## 38. TÜKETİCİ MEVZUATI DESTEĞİ

- Garanti kapsamındaki onarımda **azami tamir süresi (20 iş günü)** sayacı ve uyarısı.
- Onarımda geçen sürenin garantiye eklenmesi.
- **Sökülen parça** teslim hakkı — tutanakla belgelenir.
- Cayma hakkı (mesafeli satış) akışı.
- Tüketici hakem heyeti uyuşmazlığında savunma dosyası: servis geçmişi, iletişim kayıtları, onaylar, beyanlar tek PDF olarak dışa aktarılabilir.
- Fiyat etiketlerinde TL ve KDV dahil gösterim.

## 39. KVKK VE İYS

ByteNova müşteri adı, telefon, adres, cihaz ve servis geçmişi gibi kişisel verileri işler.

- Aydınlatma yükümlülüğü açık rızadan bağımsız ele alınır; aydınlatma metinleri **yönetilebilir ve versiyonlu** içeriktir (uygulamaya örnek metin gömülmez, işletmenin hukukçusu onaylar).
- Mimari gereksinimler: veri erişim yetkileri, veri dışa aktarma kaydı, audit log, kullanıcı bazlı erişim, saklama politikaları, silme/anonimleştirme süreçleri.
- Ticari elektronik ileti = İYS onayı (Bölüm 31.2); operasyonel/ticari ileti ayrımı sistematiktir.
- Seri numarası, telefon ve finansal alanlar gereksiz loglanmaz; log maskeleme uygulanır.

## 40. HUKUKİ NOT

Bu doküman ürün gereksinimleri ve yazılım mimarisi dokümanıdır; mali müşavirlik, vergi danışmanlığı veya hukuki görüş yerine geçmez. e-belge, ÖKC, garanti, yenilenmiş ürün, gider pusulası, özel matrah, tevkifat, tüketici işlemleri, İYS ve KVKK uygulamaları üretime alınmadan önce güncel mevzuat ve uzman doğrulamasından geçirilmelidir. Referans kurumlar: GİB (VUK 509 Tebliği ve e-belge düzenlemeleri), Ticaret Bakanlığı (garanti ve satış sonrası hizmetler, yenilenmiş ürün yönetmeliği), BDDK (taksit sınırlamaları), KVKK Kurumu (aydınlatma yükümlülüğü), İYS.

---

# BÖLÜM V — TEKNİK MİMARİ

## 41. TEKNOLOJİ YIĞINI

- **Frontend:** React/Next.js (Showroom SSR + Panel SPA/PWA) — tek tasarım sistemi paketi
- **Masaüstü:** Tauri (öncelik — hafiflik) veya Electron; içinde panel + lokal veritabanı + donanım köprüsü servisi
- **Backend:** Modüler monolit ile başlayan API (Laravel/PHP veya NestJS/TypeScript — ekip yetkinliğine göre); domain sınırları korunur
- **DB:** PostgreSQL (sunucu) + SQLite (masaüstü lokal replika)
- **Cache/Queue:** Redis
- **Object Storage:** S3 uyumlu (fotoğraflar, PDF'ler, e-belge arşivi)
- **Arama:** PostgreSQL full-text ile başla; büyüyünce OpenSearch/Meilisearch
- **PDF:** Sunucu tarafı render + masaüstünde lokal render (offline form basımı için)
- **Monitoring:** Sentry + uygulama metrikleri + uptime/status sayfası
- **Deployment:** Docker + CI/CD; masaüstü için imzalı otomatik güncelleme kanalı (stable/beta)

Teknoloji seçimi değişebilir; korunması gereken şey modüler mimari ve sağlayıcı soyutlamalarıdır.

## 42. MODÜLER BACKEND — DOMAIN SINIRLARI

`Identity` `Tenant` `Customer` `Device` `Service` `Inventory` `Assembly(BOM)` `Sales` `Purchasing` `Finance` `Cheques` `Expenses` `Contracts` `Documents(e-belge)` `TaxRules` `Currency` `Notifications(+İYS)` `Reporting` `Integrations` `Marketplace` `Audit` `Sync`

Modüller birbirine doğrudan tablo manipülasyonu ile değil domain servisleri/event'ler üzerinden bağlanır.

## 43. EVENT MİMARİSİ

Örnek event'ler:

`ServiceCreated` `ServiceAssigned` `ServiceApprovalRequested` `ServiceApproved` `AdvancePaymentReceived` `PartReserved` `PartConsumed` `RemovedPartRecorded` `ServiceSentToExternal` `ServiceCompleted` `DeviceUnclaimedThresholdReached` `SaleCreated` `DiscountLimitExceeded` `PaymentReceived` `ChequeDueSoon` `StockBelowMinimum` `StockWentNegative` `ExchangeRateUpdated` `PriceListRecalculated` `AssemblyCompleted` `WarrantyExpiring` `ContractRenewalDue` `DocumentIssued` `SyncConflictDetected`

Bildirim, rapor ve senkron gibi yan işlemler ana akışı kirletmez.

## 44. VERİTABANI ANA VARLIKLARI

v1.0 listesine ek olarak (kalın olanlar v2.0'da eklendi):

tenants, branches, users, roles, permissions, **feature_flags**, customers, customer_addresses, customer_contacts, **customer_consents (İYS)**, devices, device_types, device_serials, products, product_categories, product_barcodes, **product_compatibilities**, **price_lists, price_list_items, price_rules**, **currencies, exchange_rates**, warehouses, warehouse_locations, suppliers, **supplier_feeds**, purchases, purchase_items, purchase_payments, **purchase_requests**, sales, sale_items, sale_payments, **sale_discounts**, **installment_rules**, **license_keys**, stock_movements, stock_reservations, **assembly_recipes (BOM), assembly_orders, disassembly_orders**, service_orders, service_status_history, service_items, service_parts, **service_removed_parts**, **service_advances**, **external_service_jobs**, **shipments (kargo)**, **unclaimed_device_logs**, service_approvals, service_tests, service_photos, service_documents, **consent_templates (beyan şablonları)**, quotes, quote_items, **maintenance_contracts, contract_visits**, cash_accounts, cash_transactions, **expenses, expense_categories**, **cheques, cheque_events**, **pos_devices, pos_settlements**, accounts_receivable, accounts_payable, **fx_difference_records**, warranties, invoices, **expense_vouchers (gider pusulası)**, e_document_records, **fiscal_receipts (ÖKC)**, **tax_rules (versiyonlu)**, **commission_rules, commission_records (prim)**, notifications, **message_templates**, audit_logs, **sync_queue, sync_conflicts**, settings

İlişkilerde tenant sınırı her sorguda enforce edilir.

## 45. ÇOKLU TENANT VE ŞUBE MİMARİSİ

- Her kayıt `tenant_id`, gerekli yerlerde `branch_id` taşır.
- Bir işletmenin müşterisi, stoğu, servisi, personeli, finansal verisi başka işletmeye hiçbir koşulda görünmez.
- Hiyerarşi: `Tenant → Branch → Users → Customers → Devices → Services → Inventory → Sales → Finance`
- İlk sürüm tek şubeyle başlar; veri modeli çok şubeye hazırdır (şube bazlı stok, kasa, transfer, konsolide rapor).

## 46. OFFLINE SENKRONİZASYON — TEKNİK TASARIM

### 46.1. Lokal replika

Masaüstü istemci SQLite'ta şu verilerin okunur replikasını tutar: müşteriler, ürünler/fiyatlar, stok görünümü, açık servisler, cihazlar, son kurlar, beyan/mesaj şablonları. Replika arka planda delta senkronla güncel tutulur.

### 46.2. Outbox (giden kutusu) deseni

Offline yapılan her yazma işlemi imzalı ve sıralı olarak lokal kuyruğa yazılır: `ULID + işlem tipi + payload + cihaz kimliği + yerel zaman`. Bağlantı gelince sırayla sunucuya gönderilir; sunucu idempotent işler (aynı işlem iki kez gönderilse bir kez uygulanır).

### 46.3. Çakışma çözümü

- **Finansal olmayan alanlar** (not, telefon, açıklama): son yazan kazanır + audit'te her iki değer.
- **Stok/finansal işlemler:** Sunucu otoritedir. Offline satış stoğu eksiye düşürdüyse negatif stok politikası devreye girer; çakışma `sync_conflicts` kutusuna düşer, yetkili kullanıcı karara bağlar.
- **Resmi belge numaraları** offline üretilmez; offline satışlar geçici operasyon numarası alır, online olunca belge kesilir.
- Aynı servise iki cihazdan eşzamanlı müdahale versiyon damgasıyla yakalanır (optimistic locking).

### 46.4. Güvenlik

Lokal veritabanı şifrelidir (cihaz çalınırsa müşteri verisi açık kalmaz); oturum süresi dolunca offline erişim salt yeniden kimlik doğrulamayla açılır; tenant verisi cihazda yalnız yetkili kapsamda tutulur.

## 47. GÜVENLİK

Argon2id/bcrypt parola hashleme, MFA opsiyonu, RBAC, tenant izolasyonu, CSRF/XSS/SQL injection korumaları, rate limiting, oturum yönetimi, güvenli dosya yükleme, audit log, yedekleme, hassas alan şifreleme, secret management, yönetici işlemlerinde yeniden doğrulama, lokal DB şifreleme, imzalı masaüstü güncellemeleri. Seri no, telefon ve finansal alanlar gereksiz loglanmaz.

## 48. YEDEKLEME

Günlük otomatik yedek, saklama politikası, **düzenli restore testi** (yedek "alınıyor" demek yetmez), yedekleme durumu alarmı, tenant bazlı dışa aktarma (işletme kendi verisinin sahibidir — tam export her zaman mümkündür; bu KVKK ve müşteri güveni açısından da gereklidir).

## 49. SİLME YERİNE DENETİM İZİ

Finansal ve operasyonel kayıtlar fiziksel silinmez: `DELETE sale` yerine `CANCELLED`. Audit log: kim, ne zaman, önceki değer, yeni değer, IP/oturum, sebep.

Özellikle immutable/audit edilen işlemler: satış iptali, stok düzeltmesi, alış/satış fiyatı değişimi, **iskonto limit aşımı onayı**, **kur override**, kasa hareketi, **çek durumu değişimi**, kullanıcı rol değişimi, müşteri verisi dışa aktarımı, servis fiyat değişikliği, müşteri onay kaydı, **gider pusulası düzenleme**, **avans iadesi**.

## 50. TEST STRATEJİSİ

- **Unit:** Fiyat/kur hesapları, vergi kural motoru (KDV, tevkifat, özel matrah, taksit limiti), stok, durum makineleri, prim hesapları.
- **Integration:** Satış → stok → ödeme → belge; alış(USD) → kur → fiyat listesi; BOM → stok; servis → parça → onay → teslim.
- **E2E:** Müşteri → servis → kapora → onay → parça → teslim → tahsilat; offline satış → senkron → belge.
- **Security:** Tenant izolasyonu, RBAC, injection, dosya yükleme, lokal DB şifreleme.
- **Concurrency:** Aynı ürünün aynı anda iki satışta kullanılması; aynı servise iki cihazdan müdahale; offline/online çakışmaları.
- **Senkron simülasyonu:** Bağlantı kopma/gelme senaryoları CI'da otomatik test edilir.

## 51. KRİTİK İŞ KURALLARI

1. Stok miktarı sebepsiz değiştirilemez; her hareket bir kayda bağlıdır.
2. Satış iptali audit kaydı oluşturur; finansal kayıt hard delete edilmez.
3. Seri numarası aynı tenant içinde çakışamaz.
4. Bir servis aynı anda iki aktif ana duruma sahip olamaz.
5. Müşteri onayı olmadan onay gerektiren iş başlatılamaz.
6. Finansal yetkisi olmayan personel alış maliyetini ve kâr marjını göremez.
7. Tenant sınırı hiçbir sorguda atlanamaz.
8. Ödeme ile satış/servis ilişkisiz kalamaz; avans mutlaka bir servise/satışa bağlıdır.
9. Serviste tüketilen parça stok hareketi oluşturur; sökülen parçanın akıbeti kayıtsız kalamaz.
10. Teslim edilen cihazın durum geçmişi korunur.
11. İskonto yetki limiti aşılırsa onaysız satış kapanmaz.
12. Dövizli işlemler işlem anındaki kurla sabitlenir; kur override audit'lenir.
13. Resmi belge offline üretilemez.
14. Ticari ileti İYS izni olmayan müşteriye gönderilemez.
15. Negatif stok, tenant politikasına aykırı şekilde oluşamaz.
16. Vergi kuralları koda gömülemez; yalnız kural motorundan okunur.

## 52. GELİŞTİRİCİ İÇİN ALTIN KURAL

Hiçbir modül sadece "ekran" olarak geliştirilmez. Her özellik için zincir:

**UI → Application Service → Domain Rule → Database → Audit → Event → Notification/Report → (Sync)**

Örnek — "Servisi Tamamla" butonu yalnız status değiştirirse ürün bozulur. Doğru davranış: açık parçalar kontrol edilir → test checklist kontrol edilir → bekleyen onay değerlendirilir → sökülen parça akıbeti doğrulanır → maliyetler (kur dahil) hesaplanır → durum değişir → audit oluşur → event yayınlanır → müşteri bildirimi tetiklenir → senkron kuyruğuna yazılır.

---

# BÖLÜM VI — GERÇEK HAYAT SENARYOLARI

## 53. SENARYO KATALOĞU

### S1 — Ekran kırık laptop (uçtan uca)
Ayşe Hanım laptop getirir. Kabul: `BN-2026-00342`, hasar fotoğraflanır, laptop+adaptör aksesuar kaydı, veri beyanı onaylatılır. Teşhis: 15.6 FHD panel — maliyet 3.200 TL (stokta, 96 USD'den alınmış), müşteri fiyatı 5.000 TL + işçilik 1.000 TL = 6.000 TL. Panel pahalı olduğundan 2.000 TL kapora alınır. Onay SMS linkinden gelir. Onarım + test checklist. Teslimde kalan 4.000 TL tahsil edilir, ÖKC fişi kesilir, sökülen kırık panel müşteriye teslim edildi olarak tutanağa işlenir, teslim belgesi QR'lı basılır.

### S2 — Müşteri onay vermiyor
7.500 TL teklif reddedilir. Sistem: onay durumu reddedildi, teşhis raporu saklanır, ücretli teşhis (önceden beyan edilmiş 300 TL) kalemi oluşur, cihaz teslim bekleyen duruma geçer, hazır mesaj üretilir.

### S3 — Stokta olmayan parça
Panel stokta yok → `Parça Bekleniyor` + satın alma talebi `PR-00057`. Toptancı XML'inde parça Penta'da görünür (89 USD). Sipariş verilir; mal gelince alış kaydı → stok girişi → servis otomatik bağlanır → teknisyene bildirim.

### S4 — Kur sabah %2 arttı
Dashboard uyarır: "34 ürünün satış fiyatı kur kuralına göre güncellenmeli." Sahibi tek ekranda önizler, onaylar, yeni etiketleri toplu basar. Dövizli teklif verilen kurumsal müşteriye "teklif kuru güncellendi" bilgisi düşer.

### S5 — Toplama PC siparişi
Müşteri oyun PC'si ister. "Orta Segment" reçetesi açılır, müşteriyle parçalar revize edilir (ekran kartı yükseltilir). Toplama emri parçaları rezerve eder; montaj + stres testi checklist'i tamamlanır; sistem yeni cihaz kaydı ve seri no üretir; satışta 12 taksit istenir — kural motoru elektronik ürün taksit limitini uygular, kasiyere izin verilen maksimum taksiti gösterir.

### S6 — Toptancıya çekle ödeme
45.000 TL'lik alım için 60 gün vadeli çek yazılır. Çek "verilen çekler" portföyüne girer; vadeden 7 gün önce nakit akış uyarısı düşer: "12.09'da 45.000 TL çek çıkışı var, beklenen tahsilatlar: 38.000 TL."

### S7 — İkinci el laptop alımı (gider pusulası)
Vergi mükellefi olmayan müşteriden laptop alınır: test raporu (disk %82, batarya %76), alış 9.000 TL. Sistem gider pusulası PDF'i üretir, müşteri imzalar, belge cihaz kaydına bağlanır. Yenileme: yeni SSD takılır (maliyete eklenir). Satışta özel matrah kuralı uygulanır; cihazın tüm yaşam döngüsü korunur.

### S8 — Kurumsal bakım sözleşmesi
Okul ile 25 bilgisayar, aylık 7.500 TL, 2 iş günü müdahale SLA'lı yıllık sözleşme. Aylık ziyaret görevleri otomatik açılır; kapsam dışı bir anakart değişimi normal ücretli servise dönüşür; ay sonunda tevkifatlı e-Fatura kesilir; sözleşme bitiminden 30 gün önce yenileme hatırlatması gelir.

### S9 — Teslim alınmayan cihaz
Tamir biten telefon 15 gün alınmaz → otomatik SMS. 30. gün arama görevi. 60. gün sistem ihtar PDF'i üretir (iadeli taahhütlü gönderim için). 6. ayda yönetici kararıyla cihaz beyan edilen koşullar çerçevesinde elden çıkarma sürecine alınır; tüm bildirim kanıtları dosyada.

### S10 — İnternet kesildi
Öğlen fiber koptu. Kasadaki personel masaüstü uygulamasından satış yapmaya devam eder (çevrimdışı rozeti yanar), yeni servis kabul eder, formu lokal basar. Akşam bağlantı gelince 6 satış + 2 servis senkronize olur; "belgesi bekleyen 6 satış" kuyruğundan e-belgeler kesilir.

### S11 — Seri numaralı laptop satışı ve 8 ay sonrası
10 adet aynı model laptop alınır, her biri ayrı seri no ile stoklanır. `ABC004` satılır → cihaz müşteriye bağlanır, garanti başlangıcı teslim tarihi. 8 ay sonra müşteri geldiğinde seri no ile tüm geçmiş saniyeler içinde ekrana gelir; cihaz üretici garantisi kapsamında olabileceği için sistem yetkili servis yönlendirme seçeneğini hatırlatır.

### S12 — Ay sonu muhasebeci paketi
Ayın 1'inde sahibi "Muhasebeci Paketi" butonuna basar: 214 satış belgesi, 38 alış, 4 gider pusulası, giderler ve Z raporu kayıtları Luca uyumlu dosya + PDF özet olarak SMMM'ye e-postalanır.

---

# BÖLÜM VII — YOL HARİTASI VE TİCARİ MODEL

## 54. SÜRÜM PLANI

### MVP — P0 (lansman çekirdeği)

- Kullanıcı giriş sistemi + işletme kurulumu + kurulum sihirbazı
- Showroom (tanıtım + kayıt/giriş + demo)
- Dashboard (rol bazlı)
- Müşteri + cari (TL) + açılış bakiyesi importu
- Cihaz + seri no takibi
- Servis: kabul, fotoğraf, aksesuar, checklist, durum makinesi, teknisyen atama, notlar, parça kullanımı, sökülen parça, kapora/avans, ücretli teşhis, beyan şablonları, servis formu PDF, teslim alınmayan cihaz uyarıları
- Satış: hızlı satış, iskonto + yetki limiti, KDV dahil/hariç fiyat listeleri (perakende/toptan), karma ödeme, taksit kaydı, belge tipi seçimi (manuel ÖKC modu dahil), iadeler
- **Döviz:** kur çekme, dövizli alış, fiyat kuralları, toplu fiyat güncelleme
- Ürün + stok + hareket izleri + negatif stok politikası + sayım
- Alış + tedarikçi + satın alma talepleri + geriye dönük belge
- Kasa + tahsilat + **gider modülü** + kasa kapanışı
- Temel raporlar (satış, kârlılık — maliyet yöntemi seçimli, servis, stok) + muhasebeci paketi (Excel)
- Rol/yetki + audit log + yedekleme
- Excel import (müşteri, ürün, stok, tedarikçi, cihaz, cari bakiye, açık servis)
- **Masaüstü uygulaması: online mod + lokal yazdırma + offline satış/servis kabul (çekirdek senaryolar)**
- Feature flag altyapısı + tüm menünün "Çok Yakında" rozetli görünümü

### P1 (lansman sonrası 2-4 ay)

- e-Belge entegrasyonları (e-Fatura/e-Arşiv/e-İrsaliye, entegratör soyutlaması) + gider pusulası + tevkifat/özel matrah kural motoru tam
- ÖKC entegrasyonu (öncelikli 1-2 marka)
- Çek/senet portföyü + POS mutabakat
- Dövizli cari + kur farkı kayıtları + mutabakat/ekstre
- PC Toplama (BOM) + demontaj
- Toptancı XML (öncelikli 2-3 distribütör)
- Teklif tam akışı + QR onay; müşteri servis takip sayfası
- Bakım sözleşmeleri + SLA
- WhatsApp/SMS entegrasyonu + İYS
- Prim modülü + gelişmiş raporlar
- Uyumluluk matrisi; dijital ürün (lisans key)
- Offline kapsam genişletme + çakışma yönetim ekranı
- QR/barkod donanım akışları (etiket yazıcı, raf barkodu)

### P2 (4-12 ay)

- Çok şube (transfer, konsolide rapor, şube yetkileri)
- Mobil teknisyen uygulaması
- Pazaryeri entegrasyonları + cayma hakkı akışı + sanal POS/ödeme linki
- Kargo entegrasyonları
- AI asistan (arıza özeti, fiyat önerisi, stok tahmini, benzer vaka arama — yardımcı, karar verici değil)
- Gelişmiş ikinci el modülü (yenileme merkezi dikey desteği)
- Marketplace/eklenti altyapısı
- API'nin dışa açılması (Enterprise)

## 55. KURULUM SİHİRBAZI

İlk açılışta boş dashboard yerine sihirbaz:

1. İşletme bilgileri (unvan, VKN, logo)
2. Şube
3. **Para birimi ve kur tercihi** (TCMB otomatik / manuel dükkân kuru)
4. Vergi/e-belge tercihleri (entegratörlü / portal modu / şimdilik atla)
5. **Belge düzeni** (ÖKC var mı, fatura şablonu)
6. Kullanıcılar ve roller
7. Servis kategorileri + beyan şablonları (hazır taslaklardan seç)
8. Ürün kategorileri + fiyat listesi kuralı
9. Ödeme yöntemleri (kasalar, POS cihazları, taksit tablosu)
10. Yazıcı/barkod ayarları
11. İlk stok (Excel import veya elle)
12. Tamamlandı → "ByteNova işletmeniz için hazır."

Her adım atlanabilir; sihirbaz sonradan Ayarlar'dan kaldığı yerden sürdürülebilir. Kullanıcı onlarca zorunlu alanla boğulmaz.

## 56. ÖRNEK İLK GÜN DENEYİMİ

09:00 kurulum sihirbazı tamamlanır → 09:15 Excel'den 20 ürün + cari bakiyeler aktarılır → 09:40 kur çekilir, fiyat kuralı tanımlanır → 10:00 ilk müşteri gelir → 10:02 servis kaydı → 10:10 teknisyen atanır → 11:20 fiyat çıkar → 11:22 müşteri SMS linkinden onaylar → 14:30 servis tamamlanır → 15:00 müşteri QR kodlu teslim belgesini alır, ÖKC fişi kesilir → 18:30 sahibi dashboard'dan günlük ciroyu, giderleri, açık servisleri ve yarın vadesi gelen çeki görür.

Bu deneyim ürünün başarı kriteridir.

## 57. PİLOT UYGULAMA STRATEJİSİ

İlk müşteriler gerçek bilgisayarcılardan seçilir. Pilot işletmeden toplanacak veriler: günlük servis/satış sayısı, personel sayısı, ürün ve stok kalemi sayısı, en sık servis türleri, ödeme türleri dağılımı (nakit/kart/çek oranı!), döviz kullanım alışkanlığı, kullandığı mevcut sistem, en çok vakit kaybettiren işlem. ByteNova bu veriler üzerinden evrilir.

## 58. PAKETLEME VE TİCARİ MODEL

| Paket | Kapsam |
|---|---|
| **Starter** | Tek şube, sınırlı kullanıcı, çekirdek servis+satış+stok+kasa |
| **Professional** | Tam servis + döviz + çek/senet + e-belge + teklif + prim |
| **Business** | Çok kullanıcı + XML/entegrasyonlar + sözleşmeler + gelişmiş rapor |
| **Enterprise** | Çok şube + API + özel entegrasyon + SLA |

- 14 gün tam özellikli deneme; demo veri seçeneği. Ücretsiz sürümü kısırlaştırmak yerine güçlü trial deneyimi.
- Eklenti/marketplace geliri (P2): e-Fatura Paketi, WhatsApp Paketi, Pazaryeri Paketi, AI Asistan, Mobil Teknisyen, Barkod/POS Paketi, Muhasebe Entegrasyonları. Core ürün sade kalır.

## 59. BAŞARI METRİKLERİ

- Servis kabul süresi ve müşteri bekleme süresi düşmeli
- Servislerin nerede olduğu anında bulunabilmeli; kayıp servis fişi kalmamalı
- Stok farkları azalmalı; kur kaynaklı fiyat gecikmesi/zararı azalmalı
- Tahsilat ve çek vadesi takibi iyileşmeli
- Sahibin günlük görünürlüğü artmalı; bir müşterinin tüm geçmişi saniyeler içinde bulunmalı
- Muhasebeciye veri hazırlama süresi saatlerden dakikalara inmeli

En önemli metrik:

> "Bir dükkân sahibinin gün içinde ByteNova dışında aynı operasyon için kaç farklı araç açmak zorunda kaldığı." — Hedef: sıfıra yaklaşmak.

## 60. MARKA KONUMLANDIRMASI

**ByteNova** ismi teknoloji + yenilik hissi verir.

### Ana slogan
**"Teknik servisin ve bilgisayarcının yeni nesil işletim sistemi."**

### Alternatif
**"Servisten satışa, kurdan kasaya — işletmenizin tamamı ByteNova'da."**

### Kısa ürün açıklaması
**ByteNova; bilgisayar mağazaları ve teknik servis işletmeleri için servis, stok, alış-satış, döviz, e-belge, çek/senet, müşteri, kasa ve raporlama süreçlerini tek platformda birleştiren; online ve offline çalışabilen profesyonel işletme yazılımıdır.**

## 61. ÜRÜNÜN EN BÜYÜK FARKI

Fark "1000 özellik" değildir. Fark şudur:

> **Dükkândaki fiziksel cihaz ile dijital kaydı aynı varlık olarak, dolarla alınıp lirayla satılan ürünün gerçek maliyetiyle birlikte takip etmek.**

Gerçek laptop → barkod → servis → teknisyen → parça → müşteri onayı → ödeme → belge → teslim → garanti → tekrar servis.
Ve paralelinde: USD alış → kur → stok → satış → fiş/fatura → kasa/çek → gerçek kâr.

Bu iki zincir kopmadığı sürece ByteNova güçlü bir üründür.

---

## 62. YAPILMAMASI GEREKENLER

- Her kullanıcıya admin yetkisi verilmez.
- Finansal kayıtlar hard delete edilmez.
- Vergi oranları, taksit limitleri, e-belge kuralları koda sabit yazılmaz.
- WhatsApp/SMS/entegratör/ÖKC/pazaryeri sağlayıcılarına core servisler doğrudan bağlanmaz — hepsi soyutlama arkasındadır.
- Servis ile satış ayrı uygulamalar gibi tasarlanmaz.
- Seri numarası basit metin alanı olarak geçiştirilmez.
- Stok düzeltmesi audit'siz yapılmaz.
- Fiyat, para birimi belirtilmeden saklanmaz.
- İskonto, yetki kontrolsüz uygulanmaz.
- Ticari ileti İYS izinsiz gönderilmez.
- Müşteri verisi tüm personele varsayılan görünür olmaz.
- Kurulumda kullanıcı onlarca zorunlu alanla boğulmaz.
- İlk sürümde gereksiz ERP karmaşıklığı oluşturulmaz — ama menüde ürünün tüm vizyonu görünür ("Çok Yakında" sistemi).
- Offline modda resmi belge numarası üretilmez.

---

*Bu doküman ByteNova ürün ekibinin ana referansıdır. Her yeni özellik önerisi Bölüm 4'teki Türkiye tasarım prensipleri ve Bölüm 51'deki kritik iş kurallarıyla test edilerek eklenmelidir.*
