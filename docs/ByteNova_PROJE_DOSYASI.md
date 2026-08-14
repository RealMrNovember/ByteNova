# TEKNONOVA — PROFESYONEL ÜRÜN VE PROJE DOSYASI

**Ürün:** TeknoNova
**Konumlandırma:** Bilgisayar, elektronik ve teknik servis işletmeleri için uçtan uca işletme yönetim platformu
**Hedef pazar:** Türkiye'deki bilgisayarcılar, teknik servisler, bilgisayar mağazaları ve zaman içinde diğer elektronik servis işletmeleri
**Doküman sürümü:** 1.0
**Tarih:** 14 Ağustos 2026
**Ürün karakteri:** Yerel pazar ihtiyaçlarına göre tasarlanmış, masaüstü/web tabanlı profesyonel iş yönetim sistemi

---

## 1. ÜRÜNÜN ANA FİKRİ

TeknoNova, bir bilgisayarcının dükkânını yönetirken kullandığı dağınık araçların yerine tek bir operasyon merkezi koyar.

Bugün tipik bir işletmede aynı anda WhatsApp mesajları, Excel dosyaları, kâğıt servis formları, stok defteri, kasa notları, muhasebe programı ve sahibinin hafızası kullanılabiliyor. TeknoNova'nın amacı bunları tek bir iş akışında birleştirmektir.

TeknoNova'nın temel sorusu şudur:

> “Bu cihaz veya ürün işletmeye nasıl girdi, şu anda nerede, kime ait, üzerinde ne işlem yapıldı, hangi parça kullanıldı, ne kadar maliyet oluştu, müşteriye ne söylendi, ne kadar tahsil edildi ve son olarak kime teslim edildi?”

Sistem, bu soruların tamamına geçmişe dönük ve denetlenebilir cevap verebilmelidir.

---

## 2. ÜRÜN VİZYONU

### Vizyon

Türkiye'deki teknik servis işletmesinin yalnızca servis fişi yazdıran değil, bütün ticari operasyonunu yöneten ana yazılımı olmak.

### Misyon

Küçük bilgisayarcıdan çok şubeli teknik servis işletmesine kadar herkesin kolayca kullanabileceği; fakat arka planda kurumsal düzeyde stok, servis, finans, müşteri, kullanıcı yetkisi ve raporlama altyapısına sahip bir sistem oluşturmak.

### Uzun vadeli hedef

TeknoNova'nın “bilgisayarcı programı” olarak başlayıp zaman içinde “Teknik Servis İşletim Sistemi” haline gelmesi.

Potansiyel dikeyler:

- Bilgisayar ve laptop servisleri
- Telefon/tablet servisleri
- Oyun konsolu servisleri
- Yazıcı ve sarf servisleri
- Kamera ve güvenlik sistemleri servisleri
- Elektronik cihaz servisleri
- Kurumsal IT destek firmaları
- Yenilenmiş cihaz alım-satımı yapan işletmeler

---

## 3. TÜRKİYE PAZARI İÇİN TEMEL TASARIM PRENSİPLERİ

TeknoNova Türkiye'ye özgü kullanım davranışlarını merkeze almalıdır.

### 3.1. İşletme sahibi teknik personel de olabilir

Sistem sadece muhasebe personelinin anlayacağı bir ERP gibi tasarlanmamalıdır. Bir dükkân sahibi aynı gün içinde müşteri karşılayabilir, laptop sökebilir, mal alabilir ve kapanış kasasını kontrol edebilir.

Bu nedenle kullanıcı deneyimi:

- hızlı,
- az tıklamalı,
- arama merkezli,
- klavye kullanımına uygun,
- Türkçe,
- teknik bilgisi düşük kullanıcıya da anlaşılır

olmalıdır.

### 3.2. WhatsApp gerçeği

Müşteri iletişiminde WhatsApp çok sık kullanıldığı için TeknoNova veri modelinin “müşteri ile iletişim” boyutunu desteklemesi gerekir.

Örneğin:

“Cihazınızın fan temizliği tamamlandı, toplam servis tutarı 1.250 TL. Hazır durumda.”

gibi hazır bildirimler üretilebilmeli; ancak WhatsApp gönderimi ayrı bir entegrasyon katmanı olarak tasarlanmalıdır.

### 3.3. Kâğıt tamamen yok sayılamaz

Servis kabul formu, teslim tutanağı, müşteri imzası, cihaz teslim belgesi ve çeşitli çıktılar hâlâ sahada gerekli olabilir.

Bu nedenle her kritik belge için:

- PDF oluşturma,
- yazdırma,
- e-posta paylaşımı,
- gerekiyorsa imza alma,

altyapısı düşünülmelidir.

### 3.4. İnternet kesilebilir

Küçük işletmelerde bağlantı problemi hâlâ gerçek bir senaryodur. Mimari, özellikle masaüstü istemci tercih edilirse yerel önbellek ve güvenli senkronizasyon ihtiyacını hesaba katmalıdır.

---

# 4. HEDEF KULLANICILAR

## Persona A — Tek dükkân sahibi

2-3 personel çalışıyor.

İhtiyacı:

- servis kaydı,
- stok takibi,
- satış,
- alış,
- müşteriler,
- kasa,
- günlük rapor.

Bu kullanıcı için ana ekran mümkün olduğunca sade olmalıdır.

## Persona B — Yoğun bilgisayar teknik servisi

5-15 teknik personel.

İhtiyacı:

- teknisyen atama,
- servis aşamaları,
- parça kullanımı,
- test sonuçları,
- fotoğraf,
- müşteri onayı,
- teslimat,
- performans raporları.

## Persona C — Mağaza + servis işletmesi

Hem yeni ürün satıyor hem tamir yapıyor.

İhtiyacı:

- POS benzeri hızlı satış,
- stok,
- seri numarası,
- alış maliyeti,
- satış kârlılığı,
- servis,
- cari/müşteri,
- tedarikçi.

## Persona D — Çok şubeli işletme

İhtiyacı:

- merkezden yönetim,
- şube bazlı stok,
- personel yetkileri,
- transferler,
- konsolide raporlar,
- merkezi ürün kataloğu.

---

# 5. TEMEL MODÜLLER

## 5.1. Dashboard

Ana ekran işletmenin “bugünkü durumu”nu göstermelidir.

Önerilen kartlar:

- Bugünkü satış
- Bugünkü tahsilat
- Açık servisler
- Bugün teslim edilecekler
- Onay bekleyen servisler
- Kritik stoklar
- Geciken servisler
- Açık kasa
- Bugünkü kâr tahmini
- Personel performansı

Dashboard kişiye göre değişmelidir.

Örneğin teknisyen satış toplamını görmek zorunda değildir; sahibin de teknisyenin tüm maliyet detaylarını görmesi gerekmeyebilir.

---

# 6. SERVİS YÖNETİMİ — ÜRÜNÜN KALBİ

Servis modülü TeknoNova'nın en güçlü alanı olacaktır.

## 6.1. Servis kaydı oluşturma

Müşteri geldiğinde personel:

1. Müşteri aranır veya yeni müşteri oluşturulur.
2. Cihaz türü seçilir.
3. Marka/model girilir.
4. Seri numarası/IMEI varsa kaydedilir.
5. Fiziksel durum işaretlenir.
6. Müşterinin beyan ettiği arıza yazılır.
7. Cihazla birlikte teslim edilen aksesuarlar kaydedilir.
8. Fotoğraf çekilir.
9. Tahmini ücret/inceleme durumu belirlenir.
10. Müşteri onay metni gösterilir.
11. Servis numarası oluşturulur.
12. Barkod/QR etiket basılır.

Örnek servis numarası:

`TN-2026-000184`

## 6.2. Cihaz giriş fotoğrafları

Laptop kapağındaki çizik, ekran çatlağı veya fiziksel hasar fotoğraflanabilmelidir.

Bu fotoğraflar servis kaydının parçası olmalıdır.

## 6.3. Aksesuar teslimi

Örneğin müşteri:

- laptop,
- adaptör,
- çanta

teslim ettiyse bunların her biri ayrı kaydedilmelidir.

Servis kapanırken “adaptör teslim edildi mi?” kontrolü yapılmalıdır.

## 6.4. Fiziksel kabul kontrol listesi

Cihaz türüne göre dinamik checklist:

Laptop:

- Ekran
- Klavye
- Touchpad
- USB portları
- HDMI
- Şarj girişi
- Kamera
- Mikrofon
- Hoparlör
- Kasa
- Vida/kapak durumu

Telefon:

- Ekran
- Kamera
- Face ID / biyometrik durum
- Şarj
- Hoparlör
- Mikrofon
- SIM
- Kasa

## 6.5. Servis durum makinesi

Önerilen durumlar:

`Kabul Edildi`
→ `İnceleme Bekliyor`
→ `İncelemede`
→ `Fiyatlandırma Bekliyor`
→ `Müşteri Onayı Bekliyor`
→ `Onaylandı`
→ `Onarılıyor`
→ `Test Ediliyor`
→ `Hazır`
→ `Teslim Edildi`

Alternatif son durumlar:

- İptal
- Onarılamadı
- Parça Bekleniyor
- Müşteri Vazgeçti
- Garanti Kapsamında
- Hurda / Parça İçin Ayrıldı

## 6.6. Onay akışı

Teknisyen “anakart değişmeli, maliyet 4.800 TL” dediğinde sistem doğrudan satış yaratmamalıdır.

Akış:

**Teknisyen teşhisi → Teklif → Müşteri onayı → Onarım → Test → Teslim**

Müşteri onayı tarih/saat/kullanıcı bilgisi ile kaydedilmelidir.

---

# 7. TEKNİSYEN EKRANI

Teknisyenin ana ekranı klasik yönetim panelinden farklı olmalıdır.

Teknisyen giriş yaptığında:

- Bana atanan servisler
- Öncelikli işler
- Parça bekleyenler
- Bugün test edilmesi gerekenler
- Teslime hazır cihazlar

görülmelidir.

### Teknisyen servis ekranı

Sol:

- cihaz fotoğrafı,
- müşteri,
- cihaz bilgileri.

Orta:

- arıza,
- teşhis,
- yapılan işlemler,
- kullanılan parçalar.

Sağ:

- servis durumu,
- süre,
- onay,
- maliyet,
- ödeme bilgisi.

Teknisyen teknik not yazabilmelidir.

Örnek:

> “Cihaz termal macun kuruması nedeniyle yüksek sıcaklıkta çalışıyordu. Fan temizliği yapıldı, termal macun yenilendi. FurMark ve MemTest testi başarılı.”

---

# 8. ALIM YÖNETİMİ

Bilgisayarcının dükkâna ürün alma süreci ayrı bir modül olmalıdır.

## Senaryo

Bir tedarikçiden:

- 5 adet SSD
- 3 adet RAM
- 2 adet laptop

alındı.

TeknoNova:

- tedarikçiyi,
- belgeyi,
- alış fiyatını,
- KDV bilgisini,
- ürün maliyetini,
- seri numarasını,
- stok girişini,
- ödeme durumunu

kaydetmelidir.

### Seri numaralı ürünler

Laptop, ekran kartı gibi ürünlerde seri numarası zorunlu hale getirilebilmelidir.

Böylece:

> “Bu RTX 5070 hangi alıştan geldi ve kime satıldı?”

sorusunun cevabı bulunabilir.

---

# 9. SATIŞ YÖNETİMİ

Satış ekranı hızlı olmalıdır.

Kasadaki kullanıcı:

`F2 → ürün ara → Enter → miktar → ödeme → tamam`

gibi klavye ağırlıklı çalışabilmelidir.

### Satış türleri

- Perakende satış
- Kurumsal satış
- Servisle ilişkili satış
- Paket satış
- Parça satışı
- İşçilik satışı
- Cihaz satışı

### Satış kalemleri

Satış satırı sadece ürün olmamalıdır.

Örnek:

- SSD 1 TB — 3.250 TL
- Montaj hizmeti — 500 TL
- Windows kurulumu — 750 TL

tek satışta bulunabilir.

---

# 10. SERVİS + SATIŞ ENTEGRASYONU

TeknoNova'yı rakip basit servis programlarından ayıracak özelliklerden biridir.

Örneğin servis sırasında:

> “Laptopta SSD arızalı. Yeni SSD takılacak.”

Teknisyen servis kaydından parça seçer.

Sistem:

1. Stoktan SSD'yi ayırır.
2. Servis maliyetine ekler.
3. Müşteri fiyatını oluşturur.
4. Müşteri onayını bekler.
5. Onaydan sonra stok çıkışı yapar.
6. Servis faturası/satışı ile ilişkilendirir.

Böylece servis ile stok arasında kopukluk oluşmaz.

---

# 11. STOK YÖNETİMİ

Ürün kartında en az şu alanlar olmalıdır:

- Ürün adı
- SKU
- Barkod
- Marka
- Kategori
- Birim
- Alış fiyatı
- Ortalama maliyet
- Satış fiyatı
- KDV oranı
- Minimum stok
- Kritik stok
- Depo
- Raf
- Seri numarası zorunluluğu
- Garanti bilgisi
- Tedarikçi
- Aktif/pasif

### Stok hareketleri

Her hareket kayda bağlanmalıdır:

- Alış
- Satış
- Servis kullanımı
- İade
- Depolar arası transfer
- Sayım farkı
- Hurda
- Manuel düzeltme

“Stok 12'den 11'e düştü” tek başına yeterli değildir.

Sistem:

> 12 → 11, neden: Servis #TN-2026-00184, kullanıcı: Ahmet, tarih: 14.08.2026

şeklinde iz bırakmalıdır.

---

# 12. CİHAZ ENVANTERİ

TeknoNova'da ürün ile cihaz birbirinden ayrılmalıdır.

Bir mağazada aynı modelden 10 adet laptop olabilir. Ancak seri numarası nedeniyle bunlar 10 farklı fiziksel varlıktır.

Cihaz geçmişi:

**Tedarikçi → Alış → Depo → Satış → Müşteri → Garanti → Servis → İade**

şeklinde izlenebilmelidir.

Bu yapı özellikle yenilenmiş/ikinci el cihaz operasyonunda kritik olacaktır.

---

# 13. İKİNCİ EL / YENİLENMİŞ CİHAZ OPERASYONU

Türkiye'deki bilgisayarcıların önemli bir kısmı kullanılmış cihaz alıp satabilir. TeknoNova bu senaryoyu ayrı düşünmelidir.

## Cihaz alımı

Müşteri eski laptopunu satmak istedi.

TeknoNova:

- müşteri,
- cihaz,
- seri numarası,
- fiziksel durum,
- test sonucu,
- satın alma fiyatı,
- tahmini satış fiyatı,
- cihazın işletmeye giriş tarihi

kaydeder.

## Test raporu

- CPU
- RAM
- Disk sağlık durumu
- SMART bilgisi
- Ekran
- Klavye
- Batarya
- USB
- Kamera
- Mikrofon
- Wi-Fi
- Bluetooth

gibi testler kayıt altına alınabilir.

Cihazın “yenileniyor”, “satışa hazır”, “satıldı” durumları olmalıdır.

> Not: İkinci el/yenilenmiş ürün ticaretinde ayrıca uygulanabilecek mevzuat ve belge yükümlülükleri ayrı bir hukuk/muhasebe kontrolünden geçirilmelidir. TeknoNova ilgili süreçleri desteklemeli, hukuki yükümlülükleri kendi başına yorumlayan bir sistem gibi davranmamalıdır.

---

# 14. MÜŞTERİ YÖNETİMİ — CRM LITE

Müşteri kartı:

- Ad soyad / unvan
- Telefon
- E-posta
- Adres
- Vergi bilgileri
- Müşteri tipi
- Notlar
- İletişim geçmişi
- Satın alımlar
- Servis geçmişi
- Borç/alacak veya cari bilgiler
- Kendisine ait cihazlar

### Müşteri 360° görünümü

Müşteri açıldığında tek sayfada:

> 14 satış • 3 servis • 2 cihaz • 18.450 TL toplam alışveriş • 1 açık servis • 2.000 TL bekleyen tahsilat

gibi özet görünmelidir.

---

# 15. KASA VE TAHSİLAT

Kasa modülü muhasebe programının yerine geçmek zorunda değildir; ancak işletmenin operasyonel parasal hareketlerini yönetmelidir.

### Tahsilat yöntemleri

- Nakit
- Kredi kartı
- Banka transferi
- Havale/EFT
- Açık hesap
- Karma ödeme

Örneğin 5.000 TL satış:

- 2.000 TL nakit
- 3.000 TL kart

olarak kaydedilebilmelidir.

### Kasa kapanışı

Gün sonunda:

- beklenen nakit,
- fiili nakit,
- kart toplamı,
- banka transferleri,
- fark

görülmelidir.

---

# 16. CARİ / BORÇ TAKİBİ

Kurumsal müşteriler için kritik.

Örneğin yerel bir okul veya şirket sürekli bilgisayar servisi alıyor.

Müşteri:

- 3 laptop bakımı,
- 2 SSD,
- 1 lisans/kurulum hizmeti

aldı ve ay sonunda ödeme yapacak.

TeknoNova açık hesabı ve vadesi gelen işlemleri takip edebilmelidir.

---

# 17. TEKLİF YÖNETİMİ

Teklif:

`Taslak → Gönderildi → Müşteri İnceliyor → Kabul → Reddedildi → Süresi Doldu`

Tekliften:

- satış,
- servis işi,
- sipariş

oluşturulabilmelidir.

Örneğin kurumsal müşteriye:

> 10 adet ofis bilgisayarı + kurulum + ağ yapılandırması

teklifi hazırlanır.

Teklif kabul edildiğinde satış/iş emri süreci otomatik başlayabilir.

---

# 18. SATIN ALMA / TEDARİKÇİ

Tedarikçi kartı:

- Firma adı
- Yetkili
- Telefon
- E-posta
- Vergi bilgileri
- IBAN
- Son alış
- Toplam alış
- Borç
- Ürünler

Tedarikçi performansı:

- En çok alınan ürünler
- Ortalama maliyet
- Teslimat süresi
- İade oranı
- Fiyat değişimleri

raporlanabilir.

---

# 19. GARANTİ TAKİBİ

Yeni ürün satışında:

- satın alma tarihi,
- müşteri teslim tarihi,
- garanti başlangıcı,
- garanti bitişi,
- seri numarası,
- garanti belgesi referansı

kaydedilebilmelidir.

Garanti süresi sistem tarafından ürün/işlem kurallarına göre hesaplanmalı, ancak sürelerin ürün grubu ve mevzuata göre değişebileceği unutulmamalıdır.

Ticaret Bakanlığı'nın güncel tüketici rehberine göre garanti süresi genel olarak teslimden itibaren asgari iki yıl olmakla birlikte bazı ürünlerde özel ölçütler bulunabilir; garanti kapsamındaki onarımda geçen süre garantiye eklenir. citeturn671403search0

TeknoNova bu nedenle sabit “her ürün 2 yıldır” yaklaşımını kullanmamalıdır.

---

# 20. SERVİS GARANTİSİ

Bir servis işi teslim edildikten sonra aynı arıza kısa süre içinde tekrar geldiğinde yeni servis kaydı açmak yerine önceki servisle ilişki kurulmalıdır.

Örnek:

`TN-2026-000155` → teslim edildi

20 gün sonra müşteri aynı sorunla geldi.

Yeni kayıt:

`TN-2026-000221`

ama ilişki:

`Kaynak servis: TN-2026-000155`

olmalıdır.

Böylece işletme aynı cihazın geçmişini görebilir.

---

# 21. SERVİS FORMU TASARIMI

Servis formu profesyonel olmalıdır.

Belgede:

- İşletme bilgileri
- Servis numarası
- Müşteri
- Cihaz
- Seri numarası
- Fiziksel durum
- Teslim alınan aksesuarlar
- Müşteri beyanı
- Personel notları
- Yapılan işlemler
- Kullanılan parçalar
- İşçilik
- Toplam
- Garanti/teslim notları
- Tarih
- İmza alanları
- QR doğrulama kodu

bulunmalıdır.

QR ile müşterinin servis durum ekranına ulaşması ileride eklenebilir.

---

# 22. BİLDİRİMLER

TeknoNova bildirim merkezi:

- Servis kabul edildi
- Fiyat onayı gerekiyor
- Parça bekleniyor
- Servis tamamlandı
- Cihaz teslim alınabilir
- Ödeme gecikti
- Garanti bitiyor
- Kritik stok
- Teklif süresi bitiyor

gibi olayları göstermelidir.

Kanallar entegrasyon bazlı olmalıdır:

- Uygulama içi
- E-posta
- SMS
- WhatsApp

Mesaj sağlayıcıları değiştirilebilir olmalıdır.

---

# 23. ROL VE YETKİ SİSTEMİ

TeknoNova'da “admin = her şeyi görür” yaklaşımı kullanılmamalıdır.

Önerilen roller:

### İşletme Sahibi

Tam erişim.

### Yönetici

Operasyonun tamamı; hassas finans ve sistem ayarları sınırlı.

### Kasa Personeli

Satış, tahsilat, müşteri ve kasa.

### Teknik Personel

Kendisine atanan servisler, teknik notlar, parça kullanımı.

### Depo Personeli

Stok, alış, sevkiyat, transfer.

### Muhasebe Kullanıcısı

Fatura/cari/finans ekranları.

### Şube Yöneticisi

Sadece bağlı olduğu şubenin operasyonları.

Yetkilendirme hem menü hem eylem seviyesinde olmalıdır.

Örneğin kullanıcı satış görebilir ama:

- geçmiş tarihli satış değiştiremez,
- kâr marjı göremez,
- alış maliyetini göremez,
- kayıt silemez.

---

# 24. SİLME YERİNE DENETİM İZİ

Finansal ve operasyonel kayıtların fiziksel olarak silinmesi mümkün olduğunca engellenmelidir.

Örneğin satış iptal edildiğinde:

`DELETE sale`

yerine:

`CANCELLED`

olmalıdır.

Audit log:

- kim yaptı,
- ne zaman yaptı,
- önceki değer,
- yeni değer,
- IP/oturum bilgisi gerektiğinde,
- sebep

kayıt altına alınmalıdır.

---

# 25. RAPORLAMA

## Satış

- Günlük satış
- Aylık satış
- Ürün bazlı satış
- Personel satışları
- Marka bazlı satış
- Kategori bazlı satış

## Kârlılık

- Brüt satış
- Ürün maliyeti
- İşçilik geliri
- Tahmini brüt kâr
- Servis kârlılığı

## Servis

- Açık servisler
- Ortalama servis süresi
- Teknisyen performansı
- En çok arızalanan cihazlar
- Tekrar gelen servisler
- Müşteri onay oranı

## Stok

- Kritik stok
- Hareketsiz stok
- En hızlı dönen ürünler
- Stok değeri
- Depo bazlı stok
- Seri numaralı cihazlar

---

# 26. GERÇEK HAYAT SENARYOSU 1 — EKRAN KIRIK LAPTOP

Müşteri Ayşe Hanım laptop getirir.

### Giriş

Personel cihazı teslim alır.

Sistem otomatik servis numarası verir:

`TN-2026-00342`

Personel ekran hasarını fotoğraflar.

Aksesuar:

- laptop
- adaptör

kaydedilir.

### İnceleme

Teknisyen ekran panelinin değişmesi gerektiğini tespit eder.

Sistem parçayı stoktan bulur:

`15.6 FHD Panel`

Maliyet: 3.200 TL

Müşteri satış fiyatı: 5.000 TL

İşçilik: 1.000 TL

Toplam: 6.000 TL

### Onay

Müşteriye teklif gönderilir.

Müşteri kabul eder.

### Onarım

Parça servise ayrılır.

Teknisyen değişimi yapar.

Test checklist tamamlanır.

### Teslim

Müşteri 6.000 TL öder.

Sistem:

- servis kapanır,
- stoktan parça çıkarır,
- tahsilat kaydeder,
- satış/servis gelirini ilişkilendirir,
- teslim belgesini üretir.

---

# 27. GERÇEK HAYAT SENARYOSU 2 — MÜŞTERİ ONAY VERMİYOR

Laptop için 7.500 TL teklif çıktı.

Müşteri:

> “Bu kadar para vermeyeyim, geri alacağım.”

Personel “Reddetti” seçer.

Sistem:

- onay durumunu reddedildi yapar,
- teşhis raporunu saklar,
- cihazın teslim edilmesini bekleyen durum oluşturur,
- müşteriye gönderilecek hazır mesajı üretir.

Servis ücretli teşhis içeriyorsa bu da sistem tarafından önceden tanımlı fiyat kuralına göre ayrı gösterilebilir.

---

# 28. GERÇEK HAYAT SENARYOSU 3 — STOKSUZ PARÇA

Teknisyen ekran değişimi gerektiğini tespit eder.

Stokta parça yok.

Sistem:

`Parça Bekleniyor`

durumuna geçer.

Satın alma talebi oluşturulur:

`PR-00057`

Tedarikçiden parça geldiğinde:

- alış kaydı,
- stok girişi,
- servis ilişkisi

automatik bağlanabilir.

---

# 29. GERÇEK HAYAT SENARYOSU 4 — SERİ NUMARALI LAPTOP SATIŞI

Mağaza 10 adet aynı model laptop aldı.

Her biri ayrı seri numarasıyla stoklanır.

Seri No:

`ABC001`
`ABC002`
`ABC003`
...

Müşteriye `ABC004` satılır.

TeknoNova satıştan sonra:

- cihazı satıldı yapar,
- müşteriye bağlar,
- garanti başlangıcı için teslim tarihini tutar,
- satış belgesi ile cihaz geçmişini ilişkilendirir.

Müşteri 8 ay sonra geldiğinde sadece seri numarası girilerek tüm geçmiş çıkar.

---

# 30. GERÇEK HAYAT SENARYOSU 5 — KURUMSAL MÜŞTERİ

Bir işletme 15 bilgisayarını bakım için getiriyor.

TeknoNova tek müşteriye bağlı toplu iş emri oluşturabilir.

Alt servisler:

`TN-001`
`TN-002`
`TN-003`
...

Her cihazın teknisyeni, işlemi ve maliyeti ayrı izlenirken müşterinin toplam faturalanabilir hizmeti tek yerde görülebilir.

---

# 31. GERÇEK HAYAT SENARYOSU 6 — İKİNCİ EL LAPTOP ALIMI

Müşteri eski laptopunu satmak istiyor.

Personel cihazın testlerini yapıyor.

Sonuç:

- Disk sağlığı: %82
- Batarya: %76
- Ekran: iyi
- Kasa: orta
- Klavye: iyi

TeknoNova tahmini alış fiyatını ve hedef satış fiyatını kaydeder.

Cihaz depoya alınır.

Yenileme işlemlerinden sonra “satışa hazır” olur.

Daha sonra satılır ve cihazın tüm yaşam döngüsü korunur.

---

# 32. TÜRKİYE'DE E-BELGE VE MUHASEBE ENTEGRASYONU

TeknoNova'nın kendi başına “muhasebe mevzuatını belirleyen” bir uygulama olması yerine, fatura ve e-belge süreçlerinde entegrasyon katmanı bulunmalıdır.

GİB düzenlemeleri e-Fatura/e-Arşiv/e-İrsaliye gibi e-belge süreçlerini farklı yükümlülük ve senaryolara bağlı olarak düzenlemektedir. Güncel 509 Seri No.lu Tebliğ metni ve değişiklikleri sistem tasarımında referans alınmalıdır. citeturn671403search14turn671403search2

Bu nedenle TeknoNova'da:

- e-Fatura entegrasyon arayüzü,
- e-Arşiv entegrasyonu,
- e-İrsaliye desteği,
- özel entegratör entegrasyonu,
- belge durum sorgulama,
- başarısız belge/retry mekanizması,
- belge arşivleme

modüler tasarlanmalıdır.

Önemli tasarım kuralı:

> Vergi/e-belge kuralları kodun içine “sabit rakamlar” şeklinde gömülmemeli; tarihsel olarak versiyonlanabilir ve entegratörden/configuration katmanından yönetilebilir olmalıdır.

---

# 33. GARANTİ VE SATIŞ SONRASI HİZMETLER

TeknoNova, garanti belgelerini ve servis geçmişini takip etmeli; fakat işletmenin üretici/ithalatçı/yetkili servis statüsünden doğabilecek farklı yükümlülükleri birbirine karıştırmamalıdır.

Ticaret Bakanlığı, garanti belgelerinin üretici/ithalatçı sorumluluğunda olduğunu ve satıcıların tüketiciye verilmesini sağlamakla yükümlü olduğunu belirtmektedir. Fatura veya fişin tek başına garanti belgesi yerine geçmediği de açıkça belirtilmiştir. citeturn671403search0turn488013search3

Satış sonrası hizmet yeterlilik belgesi ise belirli üretici/ithalatçı ve yetkili servis yükümlülükleri kapsamında ayrıca değerlendirilir. citeturn488013search4

Bu nedenle TeknoNova'da kullanıcıya işletme profilinde şu seçenekler sunulabilir:

- Normal satıcı
- Teknik servis
- Yetkili servis
- Üretici/ithalatçı
- Yenileme merkezi gibi özel faaliyet türleri

Ancak belge/izin durumu kullanıcı tarafından doğrulanmalı; sistem varsayımla yetkili servis statüsü vermemelidir.

---

# 34. KVKK TASARIMI

TeknoNova müşteri adı, telefon, e-posta, adres, cihaz bilgisi ve servis geçmişi gibi kişisel veriler işleyebilir.

KVKK kapsamında kişisel veri işleyen veri sorumluları için aydınlatma yükümlülüğü bulunur; bu yükümlülük açık rızadan bağımsız olarak ele alınmalıdır. Kurum ayrıca aydınlatma metinlerinin açık, anlaşılır ve işleme amacı/hukuki sebep gibi unsurları içermesi gerektiğini belirtmektedir. citeturn488013search0turn488013search2

TeknoNova mimarisinde:

- müşteri verisi erişim yetkileri,
- veri dışa aktarma,
- audit log,
- kullanıcı bazlı erişim,
- veri saklama politikaları,
- silme/anonimleştirme süreçleri,
- aydınlatma metni versiyonlama

tasarlanmalıdır.

Aydınlatma metni uygulama içine örnek metin olarak gömülmemeli; işletmenin hukuk danışmanı tarafından onaylanabilecek şekilde yönetilebilir içerik olmalıdır.

---

# 35. DOSYA VE EK BELGELER

Her servis için:

- fotoğraf,
- PDF,
- müşteri belgesi,
- servis raporu,
- cihaz test çıktısı

yüklenebilir.

Dosya sistemi:

`tenant / customer / device / service / document`

mantığında ayrıştırılmalıdır.

Her dosyanın:

- tipi,
- boyutu,
- yükleyen kullanıcı,
- yüklenme zamanı,
- ilişkili kayıt

bilgileri bulunmalıdır.

---

# 36. BARKOD VE QR

TeknoNova operasyonun fiziksel tarafında barkod/QR kullanmalıdır.

Örneğin servis cihazına:

`TN-2026-00342`

etiketi basılır.

Personel barkodu okuttuğunda doğrudan servis ekranına gider.

Stok ürünlerinde:

- barkod okut → ürün aç
- seri no okut → cihaz aç
- raf barkodu okut → depo konumu aç

akışları desteklenebilir.

---

# 37. ARAMA MOTORU

TeknoNova'nın en önemli yardımcı özelliklerinden biri güçlü global aramadır.

Tek kutuya:

- servis numarası,
- müşteri adı,
- telefon,
- seri numarası,
- IMEI,
- barkod,
- ürün adı,
- fatura numarası

yazıldığında ilgili kayıt bulunmalıdır.

Örnek:

`0532 123 45 67`

→ Müşteri
→ 3 servis
→ 2 cihaz
→ 5 satış

gösterebilir.

---

# 38. AKILLI ANA SAYFA

Dashboard statik rapor ekranı olmamalıdır.

Örneğin sistem sabah şunu gösterebilir:

> “Bugün teslim edilmesi gereken 7 servis var.”

> “3 servis müşteri onayı bekliyor.”

> “4 üründe kritik stok seviyesindesiniz.”

> “Bu ay servis geliriniz geçen aya göre %18 arttı.”

Bu katman zamanla analitik/AI özelliklerine dönüşebilir.

---

# 39. İLERİ SEVİYE AI ÖZELLİKLERİ

AI ilk sürüm için zorunlu değildir; fakat veri modeli AI'a hazır olmalıdır.

İleride:

### Arıza özetleme

Teknisyenin uzun notunu müşteriye anlaşılır dile çevirmek.

### Otomatik müşteri mesajı

Servis durumuna göre mesaj taslağı üretmek.

### Fiyat önerisi

Geçmiş servisler ve parça maliyetlerinden yararlanarak önerilen servis fiyat aralığı oluşturmak.

### Stok tahmini

Hangi ürünlerin yakında biteceğini tahmin etmek.

### Servis yoğunluğu tahmini

Hangi günler daha fazla teknik servis personeli gerektiğini öngörmek.

### Arıza bilgi asistanı

Firma içindeki geçmiş servislerden benzer vakaları bulmak.

AI karar verici değil, yardımcı olmalıdır.

---

# 40. ŞUBE MİMARİSİ

TeknoNova ilk sürümde tek işletme + tek şube ile başlayabilir; ancak veri modeli çok şubeli yapıya hazır kurulmalıdır.

Her kayıt:

`tenant_id`

ve gerekli yerlerde:

`branch_id`

taşımalıdır.

Böylece aynı yazılımın bir müşteride:

- İstanbul Kadıköy
- İstanbul Mecidiyeköy
- Ankara Çankaya

şubeleri çalışabilir.

---

# 41. ÇOKLU İŞLETME / TENANT MİMARİSİ

TeknoNova ticari SaaS olarak sunulacaksa tenant izolasyonu temel güvenlik kuralıdır.

Bir işletmenin:

- müşterisi,
- stoğu,
- servisi,
- personeli,
- finansal verisi

başka işletme tarafından hiçbir koşulda görünmemelidir.

Tasarım:

`Tenant → Branch → Users → Customers → Devices → Services → Inventory → Sales → Finance`

mantığıyla kurulmalıdır.

---

# 42. VERİTABANI ANA VARLIKLARI

Önerilen ana tablolar/entities:

- tenants
- branches
- users
- roles
- permissions
- customers
- customer_addresses
- customer_contacts
- devices
- device_types
- device_serials
- products
- product_categories
- product_barcodes
- warehouses
- warehouse_locations
- suppliers
- purchases
- purchase_items
- purchase_payments
- sales
- sale_items
- sale_payments
- stock_movements
- stock_reservations
- service_orders
- service_status_history
- service_items
- service_parts
- service_approvals
- service_tests
- service_photos
- service_documents
- quotes
- quote_items
- cash_accounts
- cash_transactions
- accounts_receivable
- accounts_payable
- warranties
- invoices
- e_document_records
- notifications
- audit_logs
- settings

İlişkilerde tenant sınırı enforce edilmelidir.

---

# 43. DURUM GEÇMİŞLERİ

Status alanı tek başına yeterli değildir.

Örneğin servis:

`Kabul → İnceleme → Onay Bekliyor → Onaylandı → Onarım → Test → Hazır → Teslim`

geçmişine sahip olmalıdır.

Her değişiklik:

- önceki durum,
- yeni durum,
- kullanıcı,
- tarih,
- açıklama

ile tutulmalıdır.

Bu hem operasyon hem müşteri uyuşmazlıkları açısından önemlidir.

---

# 44. HATA YÖNETİMİ

Üretim sisteminde kullanıcıya ham exception gösterilmemelidir.

Örneğin:

`SQLSTATE[23000]...`

yerine:

> “İşlem tamamlanamadı. Stok kaydı güncellenemedi. Lütfen tekrar deneyin.”

gösterilmelidir.

Yönetici log ekranında teknik hata görülebilir.

---

# 45. GÜVENLİK

Minimum güvenlik standardı:

- Argon2id/bcrypt parola hashleme
- MFA opsiyonu
- RBAC
- tenant izolasyonu
- CSRF koruması
- XSS koruması
- SQL injection koruması
- rate limiting
- oturum yönetimi
- güvenli dosya yükleme
- audit log
- yedekleme
- şifreli hassas veri alanları gerektiğinde
- güvenli secret management
- yönetici işlemlerinde yeniden doğrulama

Özellikle seri numarası, müşteri telefonu ve finansal bilgiler gibi alanlar gereksiz şekilde loglanmamalıdır.

---

# 46. YEDEKLEME

İşletmenin tüm verisi kritik olduğundan:

- günlük otomatik yedek,
- saklama politikası,
- geri yükleme testi,
- yedekleme durumu alarmı

olmalıdır.

“Yedek alınıyor” demek yeterli değildir. Zaman zaman restore testi yapılmalıdır.

---

# 47. OFFLINE / BAĞLANTI KESİNTİSİ

Tam offline çalışma ilk MVP için zorunlu değildir; ancak masaüstü kullanımında özellikle satış, müşteri kabulü ve mevcut servislerin görüntülenmesi için lokal önbellek düşünülebilir.

Kritik finansal işlemlerde senkronizasyon çakışmaları güvenli şekilde çözülmelidir.

---

# 48. MASAÜSTÜ PROGRAM MİMARİSİ

Kullanıcı “bilgisayar programı” istediği için TeknoNova için iki katmanlı yaklaşım önerilir:

### Ana ürün

Modern web uygulaması.

### Masaüstü uygulaması

Windows odaklı resmi TeknoNova istemcisi.

Masaüstü istemci şu avantajları sağlar:

- yazıcı erişimi,
- barkod okuyucu,
- termal yazıcı,
- yerel cihazlarla entegrasyon,
- otomatik güncelleme,
- sistem tepsisi,
- daha iyi POS deneyimi.

İlk ürün hızlı çıkarılacaksa web uygulaması + PWA/desktop wrapper ile başlanabilir; daha sonra native/desktop agent katmanı güçlendirilebilir.

---

# 49. DONANIM ENTEGRASYONLARI

TeknoNova'nın sahada güçlü olması için ileride:

- barkod okuyucu
- termal yazıcı
- A4 yazıcı
- etiket yazıcı
- müşteri ekranı
- para çekmecesi
- USB üzerinden test cihazları

ile entegrasyon düşünülebilir.

Özellikle servis kabulünde barkod/etiket basımı ürünün günlük kullanımında ciddi hız kazandırır.

---

# 50. UI/UX MİMARİSİ

TeknoNova için klasik “10 yıllık muhasebe programı” görünümü kullanılmamalıdır.

### Sol tarafta ana navigasyon

1. Genel Bakış
2. Servisler
3. Satış
4. Alış
5. Stok
6. Müşteriler
7. Tedarikçiler
8. Teklifler
9. Kasa
10. Raporlar
11. Bildirimler
12. Ayarlar

### Global üst bar

- Global arama
- Hızlı ekle
- Bildirimler
- Şube seçimi
- Kullanıcı menüsü

### Hızlı ekle

`+ Yeni`

→ Müşteri
→ Servis
→ Satış
→ Alış
→ Teklif
→ Ürün
→ Tahsilat


---

# 51. SERVİS KANBAN GÖRÜNÜMÜ

Teknik servis için güçlü bir ekran:

| Kabul | İnceleme | Onay | Onarım | Test | Hazır |
|---|---|---|---|---|---|
| TN-102 | TN-98 | TN-107 | TN-111 | TN-96 | TN-88 |

Kart üzerinde:

- cihaz,
- müşteri,
- teknisyen,
- geçen süre,
- öncelik,
- tahmini tutar

görülmelidir.

---

# 52. ÖNCELİK SİSTEMİ

Servislere:

- Düşük
- Normal
- Yüksek
- Acil

öncelikleri verilebilir.

Acil servisler dashboard'da ayrı gösterilmelidir.

---

# 53. MÜŞTERİ İLETİŞİM GEÇMİŞİ

Her servisle ilgili:

> “14:32 müşteriye fiyat iletildi.”

> “14:44 müşteri onay verdi.”

> “17:02 SMS gönderildi.”

gibi iletişim olayları tutulabilmelidir.

Böylece “ben size söylemiştim” sorunlarının azaltılması hedeflenir.

---

# 54. RAPOR: GERÇEK SERVİS KÂRININ HESAPLANMASI

Bir servis 8.000 TL'ye satılmış olabilir.

Ancak:

- parça maliyeti 4.500 TL
- işçilik maliyeti 1.000 TL
- dış servis maliyeti 500 TL

ise gerçek katkı farklıdır.

TeknoNova servis maliyet kalemlerini ayrı tutmalıdır.

---

# 55. İADELER

Satış iadesi:

- ürün iade alındı,
- stok durumu belirlendi,
- para iadesi/mahsup,
- orijinal satış ilişkisi

ile yürütülmelidir.

İade edilen ürün tekrar satılabilir durumda değilse doğrudan normal stoğa dönmemelidir.

Önerilen durumlar:

`İade Alındı → Kontrol → Yeniden Satılabilir / Arızalı / Hurda / Servise`

---

# 56. SAYIM

Depo sayımı:

1. Sayım başlat.
2. Sistem mevcut stoğu dondur veya snapshot oluştur.
3. Personel fiili miktarı girer.
4. Farklar çıkar.
5. Yönetici onaylar.
6. Düzeltme hareketi oluşturulur.

Manuel stok düzeltmeleri mutlaka audit log'a bağlanmalıdır.

---

# 57. FİNANSAL AYRIM

TeknoNova operasyonel finans ile resmi muhasebeyi ayırmalıdır.

Operasyonel:

- satış,
- tahsilat,
- kasa,
- cari,
- maliyet,
- kârlılık.

Resmi muhasebe/e-belge:

- e-Fatura,
- e-Arşiv,
- e-İrsaliye,
- muhasebe entegrasyonu.

Bu ayrım ürünün daha doğru konumlandırılmasını sağlar.

---

# 58. ENTEGRASYON MİMARİSİ

TeknoNova üçüncü parti servisleri doğrudan core koduna gömmemelidir.

Örnek:

`InvoiceProvider`
`SmsProvider`
`WhatsAppProvider`
`PaymentProvider`
`EmailProvider`
`AccountingProvider`

gibi abstraction kullanılmalıdır.

Böylece yarın entegratör değiştiğinde tüm sistem yeniden yazılmaz.

---

# 59. API-FIRST YAKLAŞIMI

Ana işlemler servis mantığından ayrılmalıdır.

Örneğin:

`POST /services`
`POST /services/{id}/approve`
`POST /services/{id}/assign`
`POST /services/{id}/complete`
`POST /stock/movements`
`POST /sales`

gibi API uçları ileride mobil uygulamayı da kolaylaştırır.

---

# 60. MOBİL GELECEK

Teknisyen için mobil uygulama özellikle değerlidir.

Telefon kamerasıyla:

- servis barkodu okutma,
- cihaz fotoğrafı,
- seri numarası,
- müşteri imzası,
- servis checklist'i

yapılabilir.

---

# 61. İLK SÜRÜM — MVP

MVP'nin amacı her şeyi yapmak değil, dükkânda gerçekten kullanılabilir olmaktır.

### MVP P0

- Kullanıcı giriş sistemi
- İşletme kurulumu
- Dashboard
- Müşteri
- Cihaz
- Servis kaydı
- Servis durumları
- Teknisyen atama
- Servis notları
- Servis parça kullanımı
- Servis formu PDF
- Satış
- Ürün
- Stok
- Alış
- Tedarikçi
- Kasa
- Tahsilat
- Temel raporlar
- Kullanıcı/rol yetkileri
- Audit log
- Yedekleme

### MVP P1

- Teklif
- Cari
- Seri numaralı cihazlar
- QR/barkod
- WhatsApp/SMS entegrasyonu
- e-belge entegrasyon altyapısı
- gelişmiş raporlar

### P2

- Çok şube
- mobil uygulama
- AI asistan
- gelişmiş ikinci el cihaz modülü
- donanım entegrasyonları
- gelişmiş satın alma

---

# 62. KURULUM ASİSTANI

İlk açılışta kullanıcıyı boş dashboard'a atmak yerine kurulum sihirbazı kullanılmalıdır.

### Adım 1

İşletme bilgileri.

### Adım 2

Şube.

### Adım 3

Vergi/e-belge tercihleri.

### Adım 4

Kullanıcılar.

### Adım 5

Servis kategorileri.

### Adım 6

Ürün kategorileri.

### Adım 7

Ödeme yöntemleri.

### Adım 8

Yazıcı/barkod ayarları.

### Adım 9

İlk stok.

### Adım 10

Tamamlandı.

Sonrasında sistem:

> “TeknoNova işletmeniz için hazır.”

demelidir.

---

# 63. ÖRNEK İLK GÜN DENEYİMİ

Bilgisayarcı TeknoNova'yı kuruyor.

Saat 09:00:

Kurulum asistanını tamamlıyor.

09:15:

20 ürün içeren Excel stok listesi içeri aktarılıyor.

10:00:

İlk müşteri geliyor.

10:02:

Servis kaydı oluşturuluyor.

10:10:

Teknisyen cihaza atanıyor.

11:20:

Teknisyen fiyat çıkarıyor.

11:22:

Müşteri onay veriyor.

14:30:

Servis tamamlanıyor.

15:00:

Müşteri QR kodlu teslim belgesini alıyor.

18:30:

İşletme sahibi dashboard'dan günlük cirosunu, açık servislerini ve stok durumunu görüyor.

Bu deneyim ürünün başarı kriteridir.

---

# 64. ONBOARDING — ESKİ PROGRAMDAN GEÇİŞ

Gerçek hayatta büyük bariyerlerden biri veri taşımadır.

TeknoNova Excel import sağlamalıdır.

Import türleri:

- Müşteriler
- Ürünler
- Stok
- Tedarikçiler
- Cihazlar

Import sihirbazı:

`Dosya Yükle → Kolonları Eşleştir → Hataları Göster → Önizle → Aktar`

---

# 65. HESAP PLANI / PAKETLEME

Önerilen ticari model:

### Starter

Tek şube, sınırlı kullanıcı.

### Professional

Tam servis + stok + satış + rapor.

### Business

Çok kullanıcı + gelişmiş rapor + entegrasyon.

### Enterprise

Çok şube + API + özel entegrasyon + SLA.

Ancak ücretsiz sürümde ticari olarak kritik özellikleri aşırı sınırlamak yerine ürünü hızlı denetmeye izin veren bir demo/trial deneyimi daha doğru olabilir.

---

# 66. Eklenti / MARKETPLACE MODELİ

TeknoNova'nın gelecekte güçlü bir gelir modeli eklentiler olabilir.

Örnek:

- e-Fatura Paketi
- WhatsApp Paketi
- SMS Paketi
- Gelişmiş Servis Paketi
- İkinci El Cihaz Paketi
- Çok Şube Paketi
- Raporlama Plus
- AI Asistan
- Mobil Teknisyen
- Barkod/POS Paketi
- Muhasebe Entegrasyonları

Bu yapı core ürünün sade kalmasını sağlar.

---

# 67. ÜRÜN MİMARİSİ ÖNERİSİ

Modern SaaS mimarisi:

**Frontend:** React/Next.js veya eşdeğer modern web stack

**Backend:** Laravel/PHP veya kurumun tercih ettiği güçlü API framework'ü

**DB:** PostgreSQL

**Cache/Queue:** Redis

**Object Storage:** S3 uyumlu storage

**Search:** Başlangıçta PostgreSQL full-text; büyüdükçe OpenSearch/Elasticsearch

**Queue:** Redis veya RabbitMQ

**PDF:** Sunucu tarafı PDF render

**Desktop:** Tauri/Electron benzeri wrapper veya native client

**Monitoring:** Sentry + uygulama metrikleri + sunucu gözlemi

**Deployment:** Docker + CI/CD

Teknoloji seçimi değişebilir; asıl korunması gereken modüler mimaridir.

---

# 68. MODÜLER BACKEND

Önerilen domain sınırları:

`Identity`
`Tenant`
`Customer`
`Device`
`Service`
`Inventory`
`Sales`
`Purchasing`
`Finance`
`Documents`
`Notifications`
`Reporting`
`Integrations`
`Audit`

Her modül diğerine doğrudan tablo manipülasyonu ile değil mümkün olduğunca domain servisleri/events üzerinden bağlanmalıdır.

---

# 69. EVENT TABANLI OLAYLAR

Örnek eventler:

`ServiceCreated`
`ServiceAssigned`
`ServiceApprovalRequested`
`ServiceApproved`
`PartReserved`
`PartConsumed`
`ServiceCompleted`
`SaleCreated`
`PaymentReceived`
`StockBelowMinimum`
`WarrantyExpiring`

Böylece bildirim ve rapor gibi yan işlemler ana akışı kirletmez.

---

# 70. AUDIT VE İŞLEM İZLEME

Özellikle aşağıdaki işlemler immutable/audit edilmeli:

- satış iptali,
- stok düzeltmesi,
- alış fiyatı değişimi,
- satış fiyatı değişimi,
- kasa hareketi,
- kullanıcı rol değişimi,
- müşteri verisi dışa aktarımı,
- servis fiyat değişikliği,
- müşteri onay kaydı.

---

# 71. TEST STRATEJİSİ

### Unit test

Fiyat, stok, vergi ve durum makineleri.

### Integration test

Satış → stok → ödeme akışı.

### E2E test

Müşteri → servis → onay → parça → teslim.

### Security test

Tenant izolasyonu, RBAC, injection, dosya yükleme.

### Concurrency test

Aynı ürünün aynı anda iki satışta kullanılması.

---

# 72. KRİTİK İŞ KURALLARI

1. Stok miktarı sebepsiz değiştirilemez.
2. Satış iptali audit kaydı oluşturur.
3. Seri numarası aynı tenant içinde çakışamaz.
4. Bir servis aynı anda iki aktif ana duruma sahip olamaz.
5. Müşteri onayı olmadan onay gerektiren servis işi başlatılamaz.
6. Teknik personel finansal yetkisi yoksa alış maliyetini göremez.
7. Tenant sınırı hiçbir sorguda atlanamaz.
8. Ödeme ile satış ilişkisiz kalmamalıdır.
9. Serviste tüketilen parça stok hareketi oluşturmalıdır.
10. Teslim edilen cihazın servis durumu geçmişi korunmalıdır.

---

# 73. GELİŞTİRİCİ İÇİN ALTIN KURAL

TeknoNova'da hiçbir modül sadece “ekran” olarak geliştirilmemelidir.

Her özellik için:

**UI → Application Service → Domain Rule → Database → Audit → Event → Notification/Report**

zinciri düşünülmelidir.

Örneğin “Servisi Tamamla” butonu yalnızca status değiştirirse ürün ileride bozulur.

Doğru davranış:

- açık parçalar kontrol edilir,
- test checklist kontrol edilir,
- varsa bekleyen müşteri onayı durumu değerlendirilir,
- maliyetler hesaplanır,
- servis durumu değiştirilir,
- audit oluşur,
- event yayınlanır,
- müşteri bildirimi tetiklenir.

---

# 74. ÜRÜNDE YAPILMAMASI GEREKENLER

- Her kullanıcıya admin yetkisi verilmemeli.
- Finansal kayıtlar hard delete edilmemeli.
- Vergi oranları ve e-belge kuralları kalıcı sabitler olarak kodlanmamalı.
- WhatsApp/SMS sağlayıcısına doğrudan core servisler bağlanmamalı.
- Servis ile satış ayrı uygulamalar gibi tasarlanmamalı.
- Seri numarası basit bir metin alanı olarak geçiştirilmemeli.
- Stok düzeltmesi audit olmadan yapılmamalı.
- Müşteri verisi tüm personel için varsayılan görünür olmamalı.
- Kurulumda onlarca zorunlu alanla kullanıcı boğulmamalı.
- İlk sürümde gereksiz ERP karmaşıklığı oluşturulmamalı.

---

# 75. BAŞARI METRİKLERİ

TeknoNova başarılı sayılmalıysa:

- servis kabul süresi düşmeli,
- müşteri bekleme süresi düşmeli,
- servislerin nerede olduğu anında bulunabilmeli,
- stok farkları azalmalı,
- kayıp servis fişleri ortadan kalkmalı,
- tahsilat takibi iyileşmeli,
- sahibin işletme hakkında günlük görünürlüğü artmalı,
- bir müşterinin tüm geçmişi saniyeler içinde bulunabilmeli.

En önemli metrik:

> “Bir dükkân sahibinin gün içinde TeknoNova dışında aynı operasyon için kaç farklı araç açmak zorunda kaldığı.”

Hedef: mümkün olduğunca sıfıra yaklaşmak.

---

# 76. İLK 30 GÜN GELİŞTİRME PLANI

## Hafta 1 — Temel altyapı

- Auth
- Tenant
- İşletme kurulumu
- Dashboard iskeleti
- RBAC
- DB
- Audit altyapısı

## Hafta 2 — Servis

- Müşteri
- Cihaz
- Servis
- Durum makinesi
- Teknisyen
- Servis formu
- Fotoğraf
- PDF

## Hafta 3 — Ticari operasyon

- Ürün
- Stok
- Alış
- Tedarikçi
- Satış
- Kasa
- Tahsilat

## Hafta 4 — Sertleştirme

- Raporlar
- Import
- QR/barkod
- Yetki iyileştirme
- Testler
- Backup
- Monitoring
- İlk gerçek kullanıcı pilotu

---

# 77. PILOT UYGULAMA STRATEJİSİ

İlk müşteriler mümkünse gerçek bilgisayarcılardan seçilmelidir.

Pilot işletmeden şu bilgiler alınmalıdır:

- Günlük servis sayısı
- Günlük satış sayısı
- Personel sayısı
- Ürün sayısı
- Ortalama stok kalemi
- En sık kullanılan servis türleri
- En sık kullanılan ödeme türleri
- Kullandığı mevcut sistem
- En çok vakit kaybettiren işlem

TeknoNova bu veriler üzerinden evrilmelidir.

---

# 78. ÜRÜNÜN EN BÜYÜK FARKI

TeknoNova'nın farkı “1000 tane özellik” olmamalıdır.

Farkı şu olmalıdır:

> **Bilgisayarcının dükkânındaki fiziksel cihaz ile dijital kaydı aynı varlık olarak takip etmek.**

Örnek:

Gerçek laptop → barkod → servis → teknisyen → parça → müşteri onayı → ödeme → teslim → garanti → tekrar servis.

Bu zincir kopmadığı sürece TeknoNova güçlü bir ürün olur.

---

# 79. MARKA KONUMLANDIRMASI

**TeknoNova** ismi teknoloji + yenilik hissi veriyor.

Önerilen söylemler:

### Ana slogan

**“Teknik servisin ve bilgisayarcının yeni nesil işletim sistemi.”**

### Alternatif

**“Servisten satışa, işletmenizin tamamı TeknoNova'da.”**

### Kısa ürün açıklaması

**TeknoNova; bilgisayar mağazaları ve teknik servis işletmeleri için servis, stok, alış, satış, müşteri, kasa ve raporlama süreçlerini tek platformda birleştiren profesyonel işletme yazılımıdır.**

---

# 80. SONUÇ — TEKNONOVA'NIN GERÇEK ÜRÜN TANIMI

TeknoNova basitçe:

> “Servis formu hazırlama programı”

değildir.

Asıl ürün:

> **Türkiye'deki bilgisayar ve teknik servis işletmesinin günlük operasyon işletim sistemidir.**

Bir cihaz işletmenin kapısından girdiği anda TeknoNova onun dijital yaşam döngüsünü başlatır.

**Giriş → Kabul → Teşhis → Teklif → Onay → Parça → Onarım → Test → Teslim → Tahsilat → Garanti → Tekrar servis**

Aynı zamanda işletmedeki ticari yaşam döngüsünü yönetir:

**Tedarikçi → Alış → Depo → Stok → Satış → Müşteri → Kasa → Kârlılık → Rapor**

İki yaşam döngüsünün kesiştiği yer TeknoNova'nın asıl değeridir.

Türkiye'deki mevzuat ve e-belge süreçleri değişebildiği için ürün bunları sabit kod kurallarından ziyade sürümlenebilir entegrasyon/configuration katmanlarıyla yönetmelidir. KVKK açısından müşteri verileri ve erişimler ilk mimariden itibaren güvenli ve denetlenebilir tasarlanmalıdır. citeturn671403search14turn671403search2turn488013search0

Bu yaklaşım TeknoNova'yı kısa vadede kullanılabilir bir bilgisayarcı programı, orta vadede profesyonel teknik servis platformu ve uzun vadede farklı servis sektörlerine açılabilen bir SaaS ürün haline getirebilir.

---

# 81. RESMİ KAYNAKLAR / TASARIM DAYANAKLARI

Bu proje dosyasındaki Türkiye mevzuatına ilişkin tasarım notları hazırlanırken aşağıdaki güncel resmi kaynaklar referans alınmıştır:

- Gelir İdaresi Başkanlığı — Vergi Usul Kanunu Genel Tebliği (Sıra No: 509), güncel metin ve e-Belge hükümleri. citeturn671403search14turn671403search2
- Gelir İdaresi Başkanlığı — e-Arşiv/e-Fatura uygulamaları hakkında resmi açıklamalar ve 2025 faaliyet raporu. citeturn671403search15
- Ticaret Bakanlığı — Garanti Belgeleri Hakkında Bilgilendirme. citeturn671403search0
- Ticaret Bakanlığı — Garanti Belgesi. citeturn488013search3
- Ticaret Bakanlığı — Satış Sonrası Hizmet Yeterlilik Belgesi. citeturn488013search4
- Kişisel Verileri Koruma Kurumu — Aydınlatma Yükümlülüğü ve ilgili güncel duyurular. citeturn488013search0turn488013search2

**Hukuki not:** Bu doküman ürün gereksinimleri ve yazılım mimarisi dokümanıdır; mali müşavirlik, vergi danışmanlığı veya hukuki görüş yerine geçmez. Özellikle e-belge, garanti, yenilenmiş ürün, tüketici işlemleri ve KVKK uygulamalarının üretime alınmasından önce güncel mevzuat ve uzman doğrulaması yapılmalıdır.
