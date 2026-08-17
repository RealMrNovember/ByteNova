// Kullanım Kılavuzu içerik kaynağı — tek kaynak.
// Yeni bir konu eklemek için KILAVUZ_KONULARI dizisine bir öge eklemek yeterli;
// index ve detay sayfaları buradan otomatik beslenir.

export type KilavuzKategori = "baslarken" | "modul" | "referans";

export type KilavuzBlok =
  | { tur: "paragraf"; metin: string }
  | { tur: "altbaslik"; metin: string }
  | { tur: "adimlar"; adimlar: string[] }
  | { tur: "liste"; ogeler: string[] }
  | { tur: "ipucu"; metin: string }
  | { tur: "uyari"; metin: string }
  | { tur: "tablo"; basliklar: string[]; satirlar: string[][] };

export type KilavuzKonu = {
  slug: string;
  baslik: string;
  ikon: string;
  kategori: KilavuzKategori;
  ozet: string;
  anahtarKelimeler: string[];
  icerik: KilavuzBlok[];
  ilgili?: string[];
};

export const KILAVUZ_KATEGORI_ADLARI: Record<KilavuzKategori, string> = {
  baslarken: "Başlarken",
  modul: "Modüller",
  referans: "Referans",
};

export const KILAVUZ_KONULARI: KilavuzKonu[] = [
  // ================= BAŞLARKEN =================
  {
    slug: "hizli-baslangic",
    baslik: "Hızlı Başlangıç",
    ikon: "🚀",
    kategori: "baslarken",
    ozet:
      "ByteNova'ya ilk giriş: işletme bilgilerinizi tamamlayın, ekibinizi davet edin, ilk kaydınızı oluşturun.",
    anahtarKelimeler: ["kurulum", "kurulum sihirbazı", "ilk giriş", "deneme", "başlangıç", "onboarding", "şube", "kasa hesabı"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "ByteNova, teknik servis ve bilgisayar işletmeleri için tasarlanmış bir işletim sistemidir — servis kabulünden satışa, stoktan kasaya kadar günlük işlerinizi tek yerden yönetirsiniz.",
      },
      { tur: "altbaslik", metin: "Kurulum Sihirbazı" },
      {
        tur: "paragraf",
        metin:
          "Kayıt olduktan sonra panele girmeden önce 6 adımlık bir kurulum sihirbazıyla karşılaşırsınız: İşletme Bilgileri, Şube, Kasa Hesabı, Ürün Kategorileri, İlk Ürünler ve Tamamlandı. Her adımı doldurup \"Devam Et\"e bastığınızda o adım hemen kaydedilir — yarıda bırakıp sonra devam etseniz de veri kaybolmaz. Acele ediyorsanız sağ üstteki \"Şimdilik atla, panele git\" bağlantısıyla sihirbazı herhangi bir adımda atlayıp doğrudan panele geçebilirsiniz; atladığınız adımları (kasa hesabı, kategoriler vb.) daha sonra ilgili modüllerden tamamlarsınız.",
      },
      {
        tur: "adimlar",
        adimlar: [
          "İşletme Bilgileri: işletme adınızı, telefon/adresinizi ve logonuzu girin — bu bilgiler servis formlarınızda ve belgelerinizde görünür.",
          "Şube: varsayılan \"Merkez\" şubenizin adını dilerseniz değiştirin (çok şubeli işletme desteği yol haritasında).",
          "Kasa Hesabı: en az bir kasa hesabı (nakit/banka/POS) oluşturun — Satış modülünü kullanabilmek için zorunludur; zaten bir hesabınız varsa bu adım otomatik atlanır.",
          "Ürün Kategorileri: isteğe bağlı olarak birkaç başlangıç kategorisi ekleyin.",
          "İlk Ürünler: Excel'den toplu içe aktarın veya elle eklemeye başlayın.",
          "Tamamlandı: panele geçmeden önce ilk müşteri ekleme, ilk satış, ekip daveti ve kılavuz gibi hızlı bağlantılar sizi bekler.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Sol menüde her modülün yanında küçük bir rozet görebilirsiniz: \"İnşada\" o özelliğin şu sıralar yapıldığını, \"Yakında\" yol haritasında olduğunu, \"🔒 Eklenti\" ise ücretli bir pakete bağlı olduğunu gösterir.",
      },
      {
        tur: "paragraf",
        metin:
          "Kurulum sihirbazını tamamladıktan sonra da işletme bilgilerini, şube adını, kasa hesaplarını ve kategorileri değiştirmek isterseniz sırasıyla profil menüsündeki \"🏪 İşletme bilgileri\" (aynı sihirbazı tekrar açar), Finans ve Stok modüllerinden devam edebilirsiniz. Ekibinizi Ayarlar sayfasındaki \"Personel Davet Et\" bölümünden e-posta ile davet edersiniz.",
      },
      { tur: "altbaslik", metin: "Deneme Süreniz" },
      {
        tur: "paragraf",
        metin:
          "Header'ın sağında gördüğünüz \"Deneme: N gün\" rozeti, ücretsiz deneme sürenizin kalan gününü gösterir. Süre dolmadan bir abonelik planına geçmeniz gerekir; sorularınız için bu kılavuzun her sayfasındaki WhatsApp destek hattını kullanabilirsiniz.",
      },
    ],
    ilgili: ["gezinme-ve-kisayollar", "roller-ve-yetkiler"],
  },
  {
    slug: "gezinme-ve-kisayollar",
    baslik: "Gezinme ve Kısayollar",
    ikon: "⌨️",
    kategori: "baslarken",
    ozet:
      "Sol menü, Ctrl+K evrensel arama, F2 hızlı satış ve header'daki diğer bileşenlerin ne işe yaradığı.",
    anahtarKelimeler: ["ctrl+k", "arama", "f2", "kısayol", "menü", "header"],
    icerik: [
      { tur: "altbaslik", metin: "Sol Menü" },
      {
        tur: "paragraf",
        metin:
          "Masaüstünde ekranın solunda sabit bir menü bulunur. Her modülün solunda bir simge, gerekiyorsa sağında bir durum rozeti görürsünüz. Menüyü daraltmak için en alttaki « butonuna tıklayın — tercihiniz tarayıcınızda hatırlanır.",
      },
      { tur: "altbaslik", metin: "Ctrl+K — Evrensel Arama" },
      {
        tur: "paragraf",
        metin:
          "Panelin her yerinden Ctrl+K (Mac'te Cmd+K) tuşuna basarak arama paletini açabilirsiniz. Palet iki tür sonuç gösterir: yazdığınız isme uyan modüller ve en az 2 karakter yazınca otomatik başlayan müşteri/cihaz/ürün araması (ad, telefon, seri no, IMEI, SKU, barkod). Bir sonuca tıklayın veya Enter'a basın, ilgili detay sayfasına gidersiniz. Yukarı/aşağı ok tuşlarıyla gezinebilir, Esc ile kapatabilirsiniz. Header'daki \"Ara: müşteri, servis no, seri no…\" kutusuna tıklamak da aynı paleti açar.",
      },
      { tur: "altbaslik", metin: "F2 — Hızlı Satış" },
      {
        tur: "paragraf",
        metin:
          "Panelin herhangi bir sayfasındayken F2 tuşuna basarsanız doğrudan Satış ekranına gidersiniz; Satış ekranındaysanız F2 imleci ürün arama kutusuna odaklar. Kasiyerlerin en sık kullandığı kısayoldur.",
      },
      { tur: "altbaslik", metin: "Header'ın Sağındakiler" },
      {
        tur: "liste",
        ogeler: [
          "💱 Döviz kuru göstergesi (USD/EUR/GBP) — tıklarsanız Ayarlar'daki döviz kurları bölümüne gider; yalnızca geniş ekranlarda görünür.",
          "\"Deneme: N gün\" rozeti — ücretsiz deneme sürenizin kalan günü.",
          "🔔 Bildirimler — şu an yapım aşamasında.",
          "Profil menüsü — işletme logonuz/adınız; işletme bilgileri ve çıkış yap burada.",
        ],
      },
      { tur: "altbaslik", metin: "Mobilde Kullanım" },
      {
        tur: "paragraf",
        metin:
          "Telefon/tablette sol menü yerine alt sekmelerde Genel, Servisler, Satış ve Menü sekmelerini görürsünüz; \"Menü\" sekmesi tüm modülleri kart görünümünde listeler.",
      },
    ],
    ilgili: ["hizli-baslangic"],
  },
  {
    slug: "roller-ve-yetkiler",
    baslik: "Roller ve Yetkiler",
    ikon: "🔑",
    kategori: "baslarken",
    ozet: "6 rol, kim neye yetkili ve personel nasıl davet edilir.",
    anahtarKelimeler: ["rol", "yetki", "davet", "personel", "izin", "kullanıcı"],
    icerik: [
      { tur: "altbaslik", metin: "Roller" },
      {
        tur: "tablo",
        basliklar: ["Rol", "Kimin İçin"],
        satirlar: [
          ["İşletme Sahibi", "Hesabı açan kişi; tüm yetkilere sahiptir, davetle atanamaz."],
          ["Yönetici", "Sahip'e çok yakın günlük yönetim yetkisi — ayarlar ve davet dahil çoğu işlem."],
          ["Kasa Personeli", "Satış yapar, kasa/tahsilat işler; sınırlı iskonto yetkisiyle."],
          ["Teknisyen", "Servis kayıtlarını yönetir, durum günceller, parça kullanır; kasa işlemi yapamaz."],
          ["Depo Personeli", "Stok girişi, sayım ve manuel düzeltme yapar."],
          ["Muhasebe", "Maliyet ve raporları görür; günlük operasyon işlemi yapmaz."],
        ],
      },
      { tur: "altbaslik", metin: "Kim Neye Yetkili" },
      {
        tur: "tablo",
        basliklar: ["Yetki", "Kimler"],
        satirlar: [
          ["Kullanıcı rolü değiştirme", "Yalnız İşletme Sahibi"],
          ["Personel davet etme, Ayarlar'ı düzenleme", "Sahip, Yönetici"],
          ["Maliyet / rapor görüntüleme", "Sahip, Yönetici, Muhasebe"],
          ["Satış yapma, kasa / tahsilat işlemleri", "Sahip, Yönetici, Kasa Personeli"],
          ["Servis kayıtlarını yönetme", "Sahip, Yönetici, Teknisyen"],
          ["Stok yönetimi (giriş, düzeltme, sayım)", "Sahip, Yönetici, Depo Personeli"],
        ],
      },
      {
        tur: "uyari",
        metin:
          "Kasa Personeli bir satışta en fazla %10'a kadar onaysız iskonto uygulayabilir. Daha yüksek bir iskonto girilirse sistem bir Yönetici veya Sahip'in e-posta/parola onayını ister. Bu sınır sunucu tarafında da zorlanır, arayüzü atlayarak aşılamaz.",
      },
      { tur: "altbaslik", metin: "Personel Davet Etme" },
      {
        tur: "adimlar",
        adimlar: [
          "Ayarlar sayfasına gidin, \"Personel Davet Et\" bölümünü bulun (yalnız Sahip/Yönetici görür).",
          "E-posta adresini girin, rolü seçin, \"Davet Oluştur\"a tıklayın.",
          "Oluşan davet bağlantısını \"🔗 Linki Kopyala\" ile alıp WhatsApp veya e-posta ile personelinize gönderin.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Davet bağlantıları 7 gün geçerlidir. Süresi dolan veya yanlış gönderilen bir daveti listeden ✕ ile iptal edip yeniden oluşturabilirsiniz.",
      },
      {
        tur: "paragraf",
        metin:
          "Kullanıcılar bölümünde her personelin rolünü, Sahip/Yönetici yetkisiyle açılır listeden anında değiştirebilirsiniz — kendi rolünüzü kendiniz değiştiremezsiniz.",
      },
    ],
    ilgili: ["ayarlar", "hizli-baslangic"],
  },

  // ================= MODÜLLER =================
  {
    slug: "genel-bakis",
    baslik: "Genel Bakış",
    ikon: "🏠",
    kategori: "modul",
    ozet: "Panelin ilk açılış ekranı — rol bazlı günlük özet kartları ve akıllı özet cümleleri.",
    anahtarKelimeler: ["dashboard", "genel bakış", "ana sayfa", "özet", "kur etkisi"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Panele girdiğinizde karşınıza çıkan Genel Bakış, işletmenizin bugünkü durumunu gerçek verilerle özetler. Üstteki kısa metin bölümü (\"Akıllı Özet\") günün öne çıkan noktalarını cümle cümle anlatır — örneğin \"Bugün 3 satışla 4.500 ₺ ciro yaptınız\" veya \"2 servis müşteri onayı bekliyor\" gibi; o gün hiçbir şey yoksa ilgili cümle hiç görünmez.",
      },
      { tur: "altbaslik", metin: "Kartlar — Herkes Aynısını Görmez" },
      {
        tur: "paragraf",
        metin:
          "Genel Bakış kartları rolünüze göre değişir: Kritik Stok herkese görünür; Bugünkü Satış yalnızca satış yetkisi olanlara (Sahip/Yönetici/Kasa Personeli); Bugünkü Tahsilat, Açık Servisler, Bugün Teslimler ve Onay Bekleyen sırasıyla kasa ve servis yetkisi olanlara; Kur Etkisi ise kasa yetkisi veya maliyet görme yetkisi olanlara (Sahip/Yönetici/Kasa Personeli/Muhasebe) gösterilir. Bir teknisyen örneğin Kritik Stok ile servis kartlarını görür, satış/kasa rakamlarını görmez.",
      },
      { tur: "altbaslik", metin: "Bugünkü Satış vs. Bugünkü Tahsilat" },
      {
        tur: "paragraf",
        metin:
          "Bu iki kart kasıtlı olarak farklı sayılar gösterebilir: \"Bugünkü Satış\" o gün yapılan TÜM satışların toplamıdır (açık hesap dahil); \"Bugünkü Tahsilat\" ise kasaya GERÇEKTEN giren tutardır (açık hesap satışlar kasaya para sokmadığı için bu rakama girmez). Aradaki fark büyükse o gün çok sayıda veresiye satış yapıldığı anlamına gelir.",
      },
      { tur: "altbaslik", metin: "Kur Etkisi" },
      {
        tur: "paragraf",
        metin:
          "Dövizli tedarikçi borcunuz varsa bu kart, borcunuzu bugün kapatsaydınız ortalama alış kurunuza göre ne kadar kur farkı ödeyeceğinizi (veya kazanacağınızı) gösterir — kur yükseldiyse kırmızı/pozitif (gider riski), düştüyse kâr olarak görünür. Ayrıntılı döküm için Finans > Cari Yaşlandırma'ya bakın.",
      },
      {
        tur: "paragraf",
        metin:
          "Kritik stok uyarısı ayrıca üstte kırmızı bir şerit olarak da belirir; tıklayınca doğrudan Stok modülünde kritik ürünler listesine götürür.",
      },
    ],
    ilgili: ["stok", "servisler", "satis", "finans"],
  },
  {
    slug: "servisler",
    baslik: "Servisler",
    ikon: "🔧",
    kategori: "modul",
    ozet:
      "Servis kabulünden teslime: kabul formu, durum takibi, parça kullanımı, kapora, teslim ve belgeler; kanban görünümü, ücretli teşhis, garanti ve teslim alınmayan cihaz takibi.",
    anahtarKelimeler: [
      "servis", "kabul", "teslim", "kapora", "avans", "parça", "teknisyen", "durum",
      "kanban", "garanti", "teşhis", "teslim alınmayan",
    ],
    icerik: [
      { tur: "altbaslik", metin: "Yeni Servis Kabul Etme" },
      {
        tur: "adimlar",
        adimlar: [
          "Servisler sayfasından \"Yeni Servis Kabul\" ile formu açın.",
          "Müşteriyi arayın veya akıştan çıkmadan yeni müşteri oluşturun.",
          "Cihazı arayın veya yeni cihaz kartı oluşturun (marka, model, seri no).",
          "Müşterinin arıza beyanını yazın.",
          "Cihaz türüne göre otomatik gelen fiziksel kontrol listesini (ekran, klavye, şarj girişi vb.) işaretleyin.",
          "Teslim alınan aksesuarları (şarj aleti, çanta, kalem vb.) chip olarak ekleyin.",
          "Önceliği seçin: Düşük, Normal, Yüksek, Acil.",
          "Servis kabul koşullarını (veri kaybı sorumluluğu, sıvı/fiziksel hasar garantisi vb.) müşteri huzurunda okuyup onaylayın.",
        ],
      },
      {
        tur: "paragraf",
        metin:
          "Kayıt oluştuğunda otomatik bir servis numarası üretilir (örnek biçim: BN-2026-000123) — bu numarayı Ctrl+K ile de arayabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Servis Detay Sayfası" },
      {
        tur: "paragraf",
        metin:
          "Bir servis kaydını açtığınızda üstte özet bilgiler (müşteri, cihaz, beyan, aksesuarlar, kontrol listesi), altında sırasıyla fotoğraflar, durum/teknisyen/notlar, kullanılan parçalar, kapora, teslim işlemi, belgeler ve en altta durum geçmişi zaman çizelgesi yer alır.",
      },
      { tur: "altbaslik", metin: "Durum Takibi ve Teknisyen Atama" },
      {
        tur: "paragraf",
        metin:
          "\"Servis Durumu\" açılır listesinden mevcut aşamayı seçip Güncelle'ye basarsınız; sistem geçmişi otomatik kaydeder ve en altta zaman çizelgesinde görünür. Olası durumlar arasında Kabul Edildi, İncelemede, Fiyatlandırma Bekliyor, Müşteri Onayı Bekliyor, Onaylandı, Onarılıyor, Test Ediliyor, Parça Bekleniyor, Dış Serviste, Kargoda, Garanti Kapsamında, Hazır, Teslim Edildi, Teslim Alınmadı, İptal, Onarılamadı, Müşteri Vazgeçti ve Hurda bulunur. \"Teknisyen\" açılır listesinden ilgili personeli atayabilirsiniz.",
      },
      {
        tur: "ipucu",
        metin:
          "\"Teknik Notlar\" ekip içindir, müşteriye hiçbir belgede gösterilmez — \"Müşteri Beyanı\" alanıyla karıştırmayın.",
      },
      { tur: "altbaslik", metin: "Kullanılan Parçalar" },
      {
        tur: "paragraf",
        metin:
          "Bir parçayı ürün aramasından seçip miktarını girerek \"+ Parça Ekle (Rezerve Et)\" dersiniz — bu aşamada stok henüz düşmez, parça \"Rezerve\" rozetiyle görünür. Yetkili biri \"✓ Onayla\" dediğinde parça gerçekten stoktan düşer ve rozet \"✓ Stoktan Düşüldü\"ye döner. Bir değişim işlemiyse (eski parça sökülüyorsa) \"Bu bir değişim — sökülen eski parça var\" kutucuğunu işaretleyip sökülen parçanın akıbetini not düşebilirsiniz.",
      },
      {
        tur: "uyari",
        metin:
          "İşletmenizin negatif stok politikası \"Yasak\" ise ve seçtiğiniz parça stokta yoksa onay işlemi engellenir; \"Onaylı\" ise stok eksiye düşmeden önce ekstra bir onay istenir. Bu politikayı Ayarlar'dan değiştirebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Parça Talebi" },
      {
        tur: "paragraf",
        metin:
          "Elinizde olmayan bir parçaya ihtiyacınız varsa \"Parça Talebi\" kartından ürünü arayıp miktar girerek talep oluşturursunuz. Satın alma ekibi Alış modülünden o ürünü içeren bir fatura girdiğinde, talebiniz otomatik \"Karşılandı\" olarak işaretlenir ve servisin Teknik Notlar'ına \"📦 Talep edilen parça geldi\" notu otomatik düşer — parçanın gelip gelmediğini kontrol etmek için satın alma ekibine sormanıza gerek kalmaz.",
      },
      {
        tur: "ipucu",
        metin:
          "Bir ürün kritik stok seviyesinin altına düştüğünde de sistem otomatik olarak bir satın alma talebi oluşturur (kaynağı \"Kritik Stok\" olarak işaretlenir) — tüm açık talepleri Alış > Talepler sayfasından tek yerden görebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Kapora / Avans Alma" },
      {
        tur: "paragraf",
        metin:
          "Servis detayındaki \"Kapora / Avans\" kartından, tamir başlamadan önce müşteriden alınan avansı tutar ve kasa hesabı seçerek kaydedebilirsiniz. Bu işlem kasa yönetim yetkisi (Sahip/Yönetici/Kasa Personeli) ister — Teknisyen kapora alamaz.",
      },
      { tur: "altbaslik", metin: "Teslim İşlemi" },
      {
        tur: "paragraf",
        metin:
          "Cihaz hazır olduğunda \"Teslim İşlemi\" kartından teslim edilen aksesuarları işaretler, isterseniz toplam tutarı girersiniz (kasa yetkiniz varsa). Sistem daha önce alınan kaporayı otomatik düşüp \"Kalan Tahsilat\" tutarını hesaplar; bu tutarı tahsil edeceğiniz kasa hesabını seçip \"✓ Teslimi Tamamla\"ya basarsınız. Teslim sonrası servis \"Teslim Edildi\" durumuna geçer.",
      },
      { tur: "altbaslik", metin: "Belgeler ve WhatsApp Gönderimi" },
      {
        tur: "paragraf",
        metin:
          "\"Belgeler\" kartından Kabul Formu'nu (ve teslimden sonra Teslim Tutanağı'nı) PDF olarak indirebilirsiniz — her ikisinde de bir QR kod bulunur. WhatsApp/SMS eklentiniz aktifse aynı belgeleri doğrudan müşterinin WhatsApp'ına gönderen yeşil butonlar da burada belirir; eklenti aktif değilse bu alanda Ayarlar > Eklentiler'e giden bir bağlantı görürsünüz.",
      },
      {
        tur: "ipucu",
        metin:
          "Belgelerdeki QR kodu okutan müşteri, oturum açmadan kendi servisinin canlı takip sayfasına gider: durum, süreç geçmişi ve (varsa) tutar/kapora bilgisi görünür. Aynı bağlantıyı \"🔗 Müşteri Takip Sayfası\"ndan da açabilir veya \"Bağlantıyı Kopyala\" ile alıp elle paylaşabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Kanban Görünümü" },
      {
        tur: "paragraf",
        metin:
          "Servisler listesinin üstündeki \"📋 Liste / 🗂️ Kanban\" düğmesiyle görünüm değiştirirsiniz. Kanban'da servisler altı sütuna gruplanır (Kabul/İnceleme, Fiyat/Onay Bekliyor, Onarımda, Test/Hazır, Teslim Alınmadı, Kapandı); bir kartın altındaki \"Durum değiştir\"e basıp yeni durumu seçmek, detay sayfasına girmeden hızlı güncelleme yapmanızı sağlar.",
      },
      { tur: "altbaslik", metin: "Ücretli Teşhis" },
      {
        tur: "paragraf",
        metin:
          "Müşteri onarım teklifini reddederse (\"bu ücrete yaptırmayacağım, geri alacağım\") servis detayındaki \"💰 Müşteri Teklifi Reddetti — Ücretli Teşhis Uygula\" butonuna basıp kabul formunda beyan edilen teşhis ücretini girersiniz. Cihaz otomatik \"Hazır\" (teslim bekliyor) durumuna geçer, ücret kartta rozet olarak görünür ve Kapora/Avans bölümünden tahsil edilebilir.",
      },
      { tur: "altbaslik", metin: "Garanti ve Tekrar Servis" },
      {
        tur: "paragraf",
        metin:
          "Teslim edilmiş bir cihaz kısa süre sonra aynı arızayla geri gelirse, o servisin detay sayfasındaki \"🛡️ Garanti Kapsamında Tekrar Servis Aç\" düğmesiyle yeni bir servis açarsınız — müşteri ve cihaz otomatik doldurulur, iki kayıt birbirine bağlanır (her ikisinde de karşılıklı bağlantı görünür). Garanti kapsamındaki servislerde \"20 iş günü\" azami tamir süresi sayacı rozet olarak gösterilir; süre yaklaştıkça/aşıldıkça renk turuncuya ve kırmızıya döner. Teslim işleminde girilen \"Garanti süresi (gün)\" değeri Ayarlar'daki varsayılanla otomatik doldurulur, isterseniz değiştirebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Teslim Alınmayan Cihazlar" },
      {
        tur: "paragraf",
        metin:
          "Bir cihaz \"Hazır\" durumunda Ayarlar'da belirlediğiniz süre (varsayılan 15 gün) boyunca teslim alınmazsa sistem otomatik olarak \"Teslim Alınmadı (Bekliyor)\" durumuna geçirir ve servise bir sistem notu düşer. Genel Bakış'taki \"Teslim Alınmayanlar\" kartı bu cihazların güncel sayısını gösterir — karta tıklayarak doğrudan filtrelenmiş listeye gidersiniz.",
      },
      {
        tur: "uyari",
        metin:
          "Gerçek SMS/arama hatırlatma zincirleri (gün 15 SMS, gün 30 arama, gün 60 ihtar) için bir mesajlaşma sağlayıcısı entegrasyonu gerekir — bugün yalnızca durum geçişi ve panel içi görünürlük otomatik; hatırlatmaları şimdilik WhatsApp/telefon ile siz yapmalısınız.",
      },
    ],
    ilgili: ["stok", "musteriler", "finans", "ayarlar"],
  },
  {
    slug: "satis",
    baslik: "Satış",
    ikon: "🧾",
    kategori: "modul",
    ozet:
      "Klavye öncelikli hızlı satış: barkod/ürün arama, iskonto, karma ödeme, belge tipi ve iade akışı.",
    anahtarKelimeler: ["satış", "kasa", "iskonto", "ödeme", "fiş", "fatura", "iade"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Satış ekranı, kasada hızlı çalışmak için tasarlanmıştır — panelin herhangi bir yerinden F2'ye basarak buraya, ardından tekrar F2 ile ürün arama kutusuna anında ulaşırsınız.",
      },
      { tur: "altbaslik", metin: "Sepete Ürün Ekleme" },
      {
        tur: "paragraf",
        metin:
          "Üst kutuya ürün adı yazın, SKU/barkod okutun ya da doğrudan yazın; açılan sonuç listesinden ürüne tıklayınca sepete eklenir (aynı ürüne tekrar tıklarsanız adedi artar). Stokta olmayan işçilik veya hizmet kalemleri için \"+ İşçilik / Hizmet Kalemi Ekle\" ile serbest metin/tutar girebilirsiniz.",
      },
      { tur: "altbaslik", metin: "İskonto ve Yuvarlama" },
      {
        tur: "paragraf",
        metin:
          "Her satırda ayrı bir \"İnd.\" (indirim tutarı) alanı, sepetin altında ise \"Genel İskonto (TL)\" alanı bulunur. \"Küsuratı Sil\" butonuna basarsanız toplam en yakın tam sayıya yuvarlanır.",
      },
      {
        tur: "uyari",
        metin:
          "Kasa Personeli rolündeki kullanıcılar toplam üzerinden en fazla %10 iskonto uygulayabilir. Bu sınır aşılırsa sistem \"Bu satıştaki iskonto oranı kasiyer limitinin üzerinde\" uyarısıyla bir Yönetici/Sahip'in e-posta ve parolasıyla onayını ister — kasiyerin kendi oturumu bu sırada bozulmaz.",
      },
      { tur: "altbaslik", metin: "Ödeme Alma" },
      {
        tur: "paragraf",
        metin:
          "Sağ paneldeki \"Ödeme\" bölümünden Nakit, Kart veya Açık Hesap (yalnızca bir müşteri seçiliyse aktif olur) seçersiniz; Nakit/Kart seçiminde hangi kasa hesabına işleneceğini de belirtmeniz gerekir. Kart ödemesinde taksit sayısı seçilebilir (azami taksit Ayarlar'dan belirlenir). Tek ödeme yöntemi yetmiyorsa \"🔀 Karma ödeme\" ile birden fazla satır ekleyip (örn. yarısı nakit, yarısı kart) tutarları paylaştırabilirsiniz — \"Kalan\" tutar sıfırlanmadan satış tamamlanamaz.",
      },
      { tur: "altbaslik", metin: "Belge Tipi" },
      {
        tur: "paragraf",
        metin:
          "Her satışta \"🕐 Sonra Kesilecek\" veya \"🧾 ÖKC Fişi Kesildi\" seçeneklerinden birini işaretlersiniz. ÖKC fişi kesildiyse fiş numarasını girmeniz zorunludur. \"Sonra Kesilecek\" işaretlenen satışlar Satış > Belgeler kuyruğunda birikir; fiş kesildiğinde oradan fiş numarasını girip belgeyi kapatırsınız.",
      },
      {
        tur: "ipucu",
        metin:
          "Müşteri kurumsalsa ve kartında VKN kayıtlıysa, \"Sonra Kesilecek\" satışın detayında fiş numarası kutusunun altında \"🧾 e-Fatura Kes\" ve \"🧾 e-Arşiv Fatura Kes\" düğmeleri de belirir. Bu, e-Belge Paketi eklentisiyle gelir — kesilen belgeler Belgeler sayfasında arşivlenir. (Sandbox: gerçek bir GİB entegrasyonu değildir, belge numarası simüle edilir.)",
      },
      { tur: "altbaslik", metin: "Satış Sonrası — Detay, Belge Kuyruğu, İadeler" },
      {
        tur: "liste",
        ogeler: [
          "Bir satışın detayına girip kalem, ödeme dökümü ve belge durumunu görebilir, kalem bazında \"İade Al\" başlatabilirsiniz.",
          "Satış > Belgeler: henüz fiş/faturası kesilmemiş satışların kuyruğu.",
          "Satış > İadeler: kontrol bekleyen iadeler — sonucu \"Satılabilir\" (ürün stoğa geri döner), \"Arızalı/Hurda\" (stoğa dönmez) veya \"Servise Yönlendir\" (müşteri seçiliyse otomatik yeni bir servis kaydı açar) olarak işaretlersiniz.",
        ],
      },
    ],
    ilgili: ["stok", "finans", "musteriler"],
  },
  {
    slug: "stok",
    baslik: "Stok",
    ikon: "📦",
    kategori: "modul",
    ozet:
      "Ürün ekleme, stok hareketleri, kritik stok, sayım, toplu fiyat güncelleme ve raf/mağaza görünümü.",
    anahtarKelimeler: [
      "stok", "ürün", "sayım", "kritik stok", "fiyat güncelle", "raf", "mağaza", "barkod",
      "dijital ürün", "lisans", "lisans anahtarı", "key", "windows", "office",
    ],
    icerik: [
      { tur: "altbaslik", metin: "Ürün Ekleme — Barkod Okutarak" },
      {
        tur: "paragraf",
        metin:
          "\"+ Yeni Ürün\"e tıkladığınızda karşınıza önce yalnızca bir barkod kutusu çıkar. Barkod okuyucuyla okutun ya da elle yazıp Enter'a basın: sistem barkodu bir ürün veritabanında arar, bulursa ürün adını ve markasını otomatik doldurur. Barkodu olmayan bir ürün ekliyorsanız \"Barkodu yok / elle gireceğim\" bağlantısıyla bu adımı atlayabilirsiniz.",
      },
      {
        tur: "ipucu",
        metin:
          "Otomatik doldurma yalnızca isim/marka gibi genel bilgiler içindir — fiyat, kategori, kritik stok gibi işletmenize özel alanları her zaman siz girersiniz. Barkod veritabanında bulunamayan ürünler (çoğu yerel/özel parça) için form doğrudan boş açılır, elle doldurmanız yeterlidir.",
      },
      { tur: "altbaslik", metin: "Kalan Bilgiler" },
      {
        tur: "paragraf",
        metin:
          "Barkod adımından sonra açılan tam formda SKU, kategori ve alış fiyatını (TL veya döviz cinsinden) girersiniz; döviz seçtiğinizde güncel kurla TL karşılığı canlı önizlenir ve isterseniz \"satış fiyatını otomatik hesapla\" ile kâr marjına göre satış fiyatı önerisi alabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Stok Hareketleri ve Kritik Stok" },
      {
        tur: "paragraf",
        metin:
          "Ürün detayında geçmiş tüm stok hareketlerini (alış, satış, servis kullanımı, iade, sayım, manuel düzeltme) nedenleriyle birlikte görürsünüz. Bir üründe stok, belirlediğiniz kritik seviyenin altına inerse ürün listede \"⚠️ Kritik Stok\" rozetiyle işaretlenir; Genel Bakış'taki kırmızı uyarı şeridi de sizi doğrudan bu listeye yönlendirir.",
      },
      { tur: "altbaslik", metin: "Manuel Stok Düzeltme" },
      {
        tur: "paragraf",
        metin:
          "Ürün detayındaki \"✏️ Stok Düzelt\" butonuyla mevcut miktarı elle değiştirebilirsiniz; her düzeltmede bir \"sebep\" (örn. sayım farkı, hasar) yazmanız zorunludur — bu, denetim (audit) kaydı için gereklidir.",
      },
      {
        tur: "uyari",
        metin:
          "Negatif stok politikanız \"Yasak\" ise, düzeltme veya satış stoğu eksiye düşürecekse işlem tamamen engellenir; \"Onaylı\" ise ekstra bir onay istenir; \"Uyarılı\" ise işlem tamamlanır ama ekranda uyarı gösterilir. Politikayı Ayarlar sayfasından değiştirebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Stok Sayımı" },
      {
        tur: "adimlar",
        adimlar: [
          "Stok > Sayım sayfasından \"Yeni Sayım\" başlatın — bu, o andaki tüm stok miktarlarının bir anlık görüntüsünü (snapshot) alır.",
          "Fiziksel sayımda saydığınız gerçek miktarları ürün ürün girin.",
          "Sayımı tamamladığınızda sistem, sayılan ile sistemdeki miktar arasındaki farkları otomatik olarak birer \"sayım düzeltmesi\" stok hareketi olarak işler; dilerseniz sayımı iptal de edebilirsiniz.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Aynı anda yalnızca bir \"Devam Ediyor\" durumunda sayım açık tutabilirsiniz; yeni bir sayım başlatmadan önce açık olanı tamamlamanız veya iptal etmeniz gerekir.",
      },
      { tur: "altbaslik", metin: "Toplu Fiyat Güncelleme" },
      {
        tur: "paragraf",
        metin:
          "Döviz kurları değiştiğinde Stok > Fiyat Güncelle (veya Ayarlar > Döviz Kurları altındaki bağlantı) sayfasına gidin — dövizli maliyetle otomatik fiyatlanan ürünler güncel kurla yeniden hesaplanır, farkı olanlar işaretlenir ve tek tıkla toplu güncellenir; her değişiklik audit kaydı bırakır.",
      },
      { tur: "altbaslik", metin: "Raf / Mağaza Görünümü" },
      {
        tur: "paragraf",
        metin:
          "Aktif olarak vitrinde/rafta satılan ürünleri (sarf malzemesi, aksesuar vb.) diğer stoktan ayırt etmek için ürün formunda \"🛒 Rafta sergileniyor\" kutucuğunu işaretleyebilirsiniz. Stok listesinin üstündeki \"Tüm Stok / 🛒 Raf Ürünleri\" anahtarıyla yalnızca bu ürünleri filtreleyebilir, ayrıca fiyat görünümünü Perakende (KDV dahil) / Toptan (KDV hariç) olarak da değiştirebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Dijital Ürün (Lisans Anahtarı)" },
      {
        tur: "paragraf",
        metin:
          "Windows/Office lisansı, antivirüs anahtarı gibi fiziksel karşılığı olmayan ürünler için ürün formunda \"🔑 Dijital Ürün\" seçeneğini işaretleyin — bu ürünün \"stoğu\" bir sayı değil, anahtar havuzudur ve bu seçim oluşturduktan sonra değiştirilemez.",
      },
      {
        tur: "adimlar",
        adimlar: [
          "Ürünü \"🔑 Dijital Ürün\" işaretli olarak kaydedin.",
          "Ürün detayındaki \"🔑 Lisans Anahtarları\" düğmesiyle anahtar havuzu sayfasına gidin.",
          "Elinizdeki anahtarları kutuya her satıra bir tane gelecek şekilde yapıştırıp \"Anahtarları Ekle\"ye basın — aynı anahtarı iki kez eklerseniz sistem yinelenenleri otomatik atlar.",
          "Hızlı Satış'ta bu ürünü sepete eklediğinizde satış tamamlanır tamamlanmaz sistem müsait bir anahtarı otomatik seçip satışa bağlar; hangi anahtarın verildiğini satış detay sayfasında görürsünüz.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Stok listesinde ve ürün detayında \"kritik stok\" yerine \"kritik anahtar sayısı\" gösterilir — müsait anahtar sayınız bu değerin altına inince uyarı rozeti belirir, tıpkı normal kritik stok gibi.",
      },
      {
        tur: "uyari",
        metin:
          "Anahtar havuzu tükenirse ilgili satış \"yeterli müsait lisans anahtarı yok\" hatasıyla engellenir — önce anahtar havuzuna yeni anahtar eklemeniz gerekir. Yanlışlıkla girilen bir anahtarı, henüz satılmadıysa anahtar listesindeki \"İptal et\" ile geçersiz kılabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Uyumlu Parçalar / Muadil Önerisi (Stok Plus)" },
      {
        tur: "paragraf",
        metin:
          "Stok Plus eklentisi aktifse, ürün detayındaki \"🔄 Uyumlu Parçalar\" bölümünden bu ürünün yerine kullanılabilecek muadil ürünleri tanımlayabilirsiniz (örn. \"bu RAM şu anakartlarla çalışır\" değil ama \"bu SSD'nin yerine şu SSD de kullanılabilir\" gibi birebir ikame parçalar). İlişki çift yönlüdür — A'yı B'nin muadili olarak eklerseniz B'nin sayfasında da A otomatik görünür.",
      },
      {
        tur: "ipucu",
        metin:
          "Bu tanım servis ekranında işe yarar: Servis detayında \"Kullanılan Parçalar\"a stokta olmayan bir parça seçtiğinizde, tanımlıysa stoktaki muadilleri hemen altında önerilir — tek tıkla seçiminizi değiştirebilirsiniz. Bu, servis hızını doğrudan etkiler.",
      },
    ],
    ilgili: ["satis", "servisler", "ayarlar"],
  },
  {
    slug: "tedarikciler",
    baslik: "Tedarikçiler",
    ikon: "🤝",
    kategori: "modul",
    ozet: "Tedarikçi kartları, dövizli cari bakiye ve ödeme takibi.",
    anahtarKelimeler: ["tedarikçi", "cari", "iban", "ödeme", "borç", "gider pusulası", "stopaj", "vergi mükellefi", "toptancı", "xml", "distribütör", "b2b", "penta"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Tedarikçiler modülü, mal aldığınız firmaların kartlarını (para birimi, IBAN, telefon, adres) ve onlara olan cari borcunuzu tutar.",
      },
      { tur: "altbaslik", metin: "Tedarikçi Kartı" },
      {
        tur: "paragraf",
        metin:
          "\"+ Yeni Tedarikçi\" ile ad ve para birimini girersiniz (bu tedarikçiyle hangi para biriminde çalıştığınız — genelde tüm alışlarınız bu para biriminde olur). IBAN, telefon, adres ve notları kart oluştuktan sonra da ekleyebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Vergi Mükellefi Olmayan Tedarikçiler — Gider Pusulası" },
      {
        tur: "paragraf",
        metin:
          "İkinci el eşya/cihaz gibi vergi mükellefi olmayan bir şahıstan alım yapıyorsanız, o tedarikçiyi oluştururken/düzenlerken \"Vergi mükellefi (işletme)\" kutucuğunu kaldırın. Bu tedarikçinin detay sayfasında beliren \"🧾 Gider Pusulası Oluştur\" ile açıklama, tutar ve isteğe bağlı bir stopaj oranı girip imzalanabilir bir PDF belge üretirsiniz — bu, e-Belge Paketi eklentisiyle gelir.",
      },
      {
        tur: "uyari",
        metin:
          "Stopaj oranı sistemde sabit değildir, siz girersiniz — gerçek oran ürün grubuna ve güncel mevzuata göre değişir. Emin değilseniz mali müşavirinize danışın.",
      },
      { tur: "altbaslik", metin: "Cari Bakiye ve Ödeme" },
      {
        tur: "paragraf",
        metin:
          "Her alış faturası otomatik olarak tedarikçiye olan borcunuzu artırır (Alış modülüne bakın). Tedarikçi detayındaki \"Cari Bakiye\" kartı güncel borcu tedarikçinin kendi para biriminde gösterir. Borç varsa \"+ Ödeme Yap\" ile ödediğiniz döviz tutarını, o günkü kuru ve hangi kasadan (TL) çıktığını girersiniz.",
      },
      {
        tur: "ipucu",
        metin:
          "Sistem, borcunuzun ağırlıklı ortalama maliyet kurunu kendiliğinden hesaplar. Ödeme yaptığınız gün kur farklıysa aradaki fark nakit hareketi yaratmadan \"Kur Farkı\" adıyla Cari Hareketler listesine otomatik işlenir — kur yükseldiyse gider, düştüyse gelir olarak.",
      },
      {
        tur: "uyari",
        metin:
          "Ödemeler tek tek fatura ile eşleştirilmez — genel bakiyeye karşı yapılır. Bir alış faturasındaki \"Ödeme Durumu\" alanı yalnızca bilgi amaçlıdır, gerçek borç takibi Cari Bakiye'dedir.",
      },
      {
        tur: "paragraf",
        metin:
          "Cari Bakiye kartındaki \"📄 Ekstre (PDF)\" bağlantısı, o tedarikçiyle olan tüm hareketleri (tarih, açıklama, borç/ödeme, bakiye) tek bir belgede indirir. Eski sisteminizden ByteNova'ya geçerken devreden bir borcunuz varsa, tedarikçide henüz hiç cari hareket yokken görünen \"📥 Açılış Bakiyesi Belirle\" ile bunu tek seferlik girebilirsiniz — bu, sahte bir alış faturası oluşturmaz.",
      },
      { tur: "altbaslik", metin: "Toptancı XML/B2B Fiyat Feed'i (Stok Plus)" },
      {
        tur: "paragraf",
        metin:
          "Stok Plus eklentisi aktifse, tedarikçi detay sayfasında distribütörün (Penta, Index/Datagate, Arena…) fiyat kataloğunu bağlayabilirsiniz. \"Şimdi Senkronize Et\" ile distribütörün güncel fiyat/stok listesi çekilir; barkod veya ürün koduyla eşleşen kendi ürünleriniz otomatik bulunur.",
      },
      {
        tur: "paragraf",
        metin:
          "\"Fiyat karşılaştırması ve fırsat listesi\" sayfasında iki liste vardır: eşleşen ürünleriniz için distribütör fiyatı × güncel kur × ürünün kâr marjıyla önerilen yeni satış fiyatı (seçip toplu uygulayabilirsiniz — Stok'taki \"Fiyat Güncelle\" ekranıyla aynı mantık); ve \"Fırsat Listesi\" — distribütörde olup sizde stokta olmayan ürünler.",
      },
      {
        tur: "ipucu",
        metin:
          "Bir ürün en az bir tedarikçi feed'iyle eşleştiyse, o ürünün Stok detay sayfasında \"📡 Toptancı Fiyatları\" kartı görünür — hangi tedarikçide kaç TL/USD'ye, kaç adet olduğunu gösterir.",
      },
    ],
    ilgili: ["alis", "stok", "finans"],
  },
  {
    slug: "alis",
    baslik: "Alış",
    ikon: "🚚",
    kategori: "modul",
    ozet: "Dövizli alış faturası girişi — stok, maliyet ve fiyat tek işlemde güncellenir.",
    anahtarKelimeler: ["alış", "fatura", "tedarikçi", "stok girişi", "maliyet", "döviz"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Alış modülü, tedarikçiden gelen faturaları kaydeder. Bir alış kaydedildiğinde tek işlemde: ürünler stoğa işlenir, ürünlerin alış maliyeti güncellenir, \"satış fiyatını otomatik hesapla\" açık ürünlerin satış fiyatı yeni maliyetle yeniden hesaplanır ve tedarikçi cari borcunuz artar.",
      },
      { tur: "altbaslik", metin: "Yeni Alış Girme" },
      {
        tur: "adimlar",
        adimlar: [
          "Alış > \"+ Yeni Alış\" ile formu açın (ya da bir tedarikçinin kartından \"+ Yeni Alış\" ile o tedarikçi önceden seçili gelir).",
          "Tedarikçiyi arayın veya akıştan çıkmadan yeni tedarikçi oluşturun.",
          "İsterseniz tedarikçinin kendi fatura numarasını ve fatura tarihini girin — fatura tarihi geriye dönük seçilebilir, geçmiş bir alışı da kaydedebilirsiniz.",
          "Para birimini ve kuru kontrol edin (tedarikçi seçilince otomatik dolar, isterseniz düzeltin).",
          "Ürünleri arayıp ekleyin, her satıra miktar ve birim fiyatı (seçtiğiniz para biriminde) girin.",
          "Ödeme durumunu (bilgi amaçlı) ve varsa notu girip \"Alışı Kaydet\"e basın.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Bir alış numarası otomatik üretilir (örnek biçim: AL-2026-000123). Alış detayında her kalemi ve tedarikçi/kur bilgisini görebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Satın Alma Talepleri" },
      {
        tur: "paragraf",
        metin:
          "Alış > \"📋 Talepler\" sayfası, henüz karşılanmamış tüm satın alma ihtiyaçlarını tek yerde toplar: teknisyenlerin servislerden oluşturduğu parça talepleri, kritik stoğa düşen ürünler için sistemin otomatik açtığı talepler ve buradan elle oluşturabileceğiniz talepler. Bir talebin yanındaki \"+ Alış Oluştur\" bağlantısı, o ürünü ve miktarını önceden doldurulmuş şekilde Yeni Alış formuna götürür — siz tedarikçiyi ve fiyatı girip kaydettiğinizde talep otomatik \"Karşılandı\" olarak işaretlenir.",
      },
    ],
    ilgili: ["tedarikciler", "stok", "servisler"],
  },
  {
    slug: "cihazlar",
    baslik: "Cihazlar",
    ikon: "💻",
    kategori: "modul",
    ozet: "Seri numarası bazlı cihaz kartları ve tam geçmiş zaman çizelgesi.",
    anahtarKelimeler: ["cihaz", "seri no", "imei", "envanter"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Cihazlar modülü, müşterilerinize ait her cihazın (laptop, telefon, masaüstü, tablet vb.) kaydını seri numarası veya IMEI ile tutar.",
      },
      { tur: "altbaslik", metin: "Cihaz Kartı Oluşturma" },
      {
        tur: "paragraf",
        metin:
          "\"+ Yeni Cihaz\" ile cihaz türü, marka, model ve seri numarasını girer, sahibi olan müşteriyi bağlarsınız. Seri numarası aynı işletme içinde benzersiz olmalıdır — aynı seri numarasıyla ikinci bir kayıt oluşturmaya çalışırsanız sistem hata verir; büyük olasılıkla cihaz zaten kayıtlıdır, Ctrl+K ile arayarak bulabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Cihaz Zaman Çizelgesi" },
      {
        tur: "paragraf",
        metin:
          "Bir cihazın detayına girdiğinizde o cihazla ilgili tüm geçmişi (oluşturulma, sahiplik değişimi, servis kayıtları, satışlar, alışlar, garanti ve notlar) tek bir zaman çizelgesinde görürsünüz — \"Bu laptop hangi alıştan geldi, kime satıldı, kaç kez servise girdi?\" sorusunun cevabı burada saniyeler içinde bulunur.",
      },
      {
        tur: "ipucu",
        metin: "Cihaz kartlarını Servisler'deki kabul formundan da, akıştan çıkmadan, doğrudan oluşturabilirsiniz.",
      },
    ],
    ilgili: ["musteriler", "servisler"],
  },
  {
    slug: "musteriler",
    baslik: "Müşteriler",
    ikon: "👥",
    kategori: "modul",
    ozet: "Müşteri kartları, iletişim geçmişi, bağlı cihazlar ve cari bakiye.",
    anahtarKelimeler: ["müşteri", "cari", "iletişim", "kurumsal", "açık hesap", "bakiye", "tahsilat"],
    icerik: [
      {
        tur: "paragraf",
        metin: "Müşteriler modülü, bireysel veya kurumsal (vergi bilgili) müşteri kartlarınızı tutar.",
      },
      { tur: "altbaslik", metin: "Müşteri Kartı" },
      {
        tur: "paragraf",
        metin:
          "\"+ Yeni Müşteri\" ile ad, birden fazla telefon numarası, kurumsal müşterilerde vergi dairesi/numarası gibi bilgileri girersiniz. Bir müşteriyi asla kalıcı olarak silemezsiniz — yalnızca pasifleştirebilirsiniz; bu, geçmiş satış/servis kayıtlarının bütünlüğünü korur.",
      },
      { tur: "altbaslik", metin: "Müşteri 360° Görünümü" },
      {
        tur: "paragraf",
        metin:
          "Müşteri detayında iletişim geçmişini (not, arama, WhatsApp, SMS, e-posta kaydı) ve o müşteriye bağlı tüm cihazları görürsünüz.",
      },
      { tur: "altbaslik", metin: "Cari Bakiye ve Tahsilat" },
      {
        tur: "paragraf",
        metin:
          "Satışta \"Açık Hesap\" ödeme yöntemi seçildiğinde tutar kasaya girmez, müşterinin cari bakiyesine borç olarak işlenir. Müşteri detayındaki \"Cari Bakiye\" kartı güncel borcu ve altındaki \"Cari Hareketler\" listesi geçmiş her açık hesap satışını/tahsilatı gösterir. Borç varsa \"+ Tahsilat Al\" ile tutarı ve hangi kasa hesabına gireceğini seçip borcu kapatabilirsiniz.",
      },
      {
        tur: "paragraf",
        metin:
          "\"📄 Ekstre (PDF)\" bağlantısı müşterinin tüm cari hareket dökümünü indirir. Eski sisteminizden devreden bir alacağınız varsa, müşteride henüz hiç cari hareket yokken görünen \"📥 Açılış Bakiyesi Belirle\" ile bunu tek seferlik girebilirsiniz.",
      },
      {
        tur: "uyari",
        metin:
          "Detay sayfasındaki Satış/Servis özet kutuları şu anda henüz gerçek verilere bağlanmamıştır (geliştirme aşamasında) — Bakiye kutusu ise gerçek cari bakiyeyi gösterir.",
      },
      {
        tur: "ipucu",
        metin: "Ctrl+K ile isim veya telefon numarasının bir kısmını yazarak herhangi bir müşteriye saniyeler içinde ulaşabilirsiniz.",
      },
    ],
    ilgili: ["cihazlar", "servisler", "satis"],
  },
  {
    slug: "finans",
    baslik: "Finans",
    ikon: "💰",
    kategori: "modul",
    ozet: "Kasa hesapları, tahsilat hareketleri, kasa kapanışı ve gider takibi.",
    anahtarKelimeler: ["kasa", "finans", "gider", "tahsilat", "kasa kapanışı", "günsonu"],
    icerik: [
      { tur: "altbaslik", metin: "Kasa Hesapları" },
      {
        tur: "paragraf",
        metin:
          "Finans ana sayfasında nakit/banka/POS tipinde kasa hesaplarınızın listesi ve toplam bakiyeniz görünür. \"+ Yeni Hesap\" ile (Ayarlar yetkisi gerekir) yeni bir hesap adı ve tipi girip oluşturursunuz — Satış ve Servis modüllerindeki tüm tahsilatlar seçtiğiniz hesaba işlenir.",
      },
      { tur: "altbaslik", metin: "Hesap Detayı ve Hareketler" },
      {
        tur: "paragraf",
        metin:
          "Bir hesabın detayında güncel bakiyeyi ve o hesaba ait tüm hareketleri (satış tahsilatı, servis kaporası/tahsilatı, gider, kasa kapanışı farkı vb.) her birinin öncesi/sonrası bakiyesiyle görürsünüz.",
      },
      { tur: "altbaslik", metin: "Kasayı Kapatma (Gün Sonu)" },
      {
        tur: "adimlar",
        adimlar: [
          "Hesap detayında \"Bugünü Kapat\" butonuna tıklayın.",
          "Sistemin hesapladığı \"Beklenen (sistem)\" tutarı görün, kasadaki gerçek (fiili) parayı sayıp bu tutarı girin.",
          "Beklenen ile fiili tutar arasında fark varsa açıklama girmek zorunludur (örn. sayım hatası, eksik/fazla para üstü).",
          "\"Kasayı Kapat\" ile onaylayın.",
        ],
      },
      {
        tur: "uyari",
        metin:
          "Bir hesabı günde yalnızca bir kez kapatabilirsiniz (\"bugün\" Türkiye saatine göre hesaplanır); \"Bugün kapatıldı\" yazısını görüyorsanız kapanış zaten yapılmış demektir. Kasa kapanışını yanlışlıkla yaptıysanız kendi başınıza geri alamazsınız — bu durumda WhatsApp destek hattından bize ulaşın, yetkili ekibimiz kaydı inceleyip geri alabilir; geri alınan bir kapanış hesap sayfasında \"Geri alındı\" rozetiyle şeffaf şekilde görünür.",
      },
      { tur: "altbaslik", metin: "Giderler" },
      {
        tur: "paragraf",
        metin:
          "Finans > Giderler sayfasından \"+ Gider Ekle\" ile kategori, açıklama, tutar, ilgili kasa hesabı ve isterseniz bir fiş fotoğrafı (en fazla 5 MB) girip gider kaydedersiniz. \"Tekrarlayan gider\" işaretlerseniz (örn. kira, elektrik) her ayın belirttiğiniz gününde bu sayfada bir hatırlatma bandı belirir.",
      },
      { tur: "altbaslik", metin: "Cari Yaşlandırma" },
      {
        tur: "paragraf",
        metin:
          "Finans > \"📊 Cari Yaşlandırma\" sayfası, açık bakiyesi olan tüm müşteri ve tedarikçilerinizi tek ekranda listeler; her satırda borcun 0-30, 31-60, 61-90 ve 90+ gün sütunlarına dağılımını görürsünüz — en eski borcun önce kapandığı varsayılarak hesaplanır. 90 günü aşan tutarlar kırmızı vurgulanır, riskli/eskimiş bakiyeleri hızlıca fark etmenizi sağlar.",
      },
      { tur: "altbaslik", metin: "Çek/Senet Portföyü" },
      {
        tur: "paragraf",
        metin:
          "Finans > \"📑 Çek/Senet\" sayfasından müşteriden aldığınız (\"Alınan\") veya toptancıya yazdığınız (\"Verilen\") çek/senetleri kaydedersiniz — keşideci/lehtar adını elle yazabilir ya da doğrudan bir müşteri/tedarikçi kartına bağlayabilirsiniz. Vadesi 7 gün içinde olan veya geçmiş alınan çek/senetler için Genel Bakış'ta ve bu sayfada uyarı rozeti belirir.",
      },
      {
        tur: "liste",
        ogeler: [
          "Alınan çek \"Tahsil Edildi\" olarak işaretlenirse seçtiğiniz kasa hesabına gerçek bir tahsilat hareketi işlenir.",
          "Alınan çek bir tedarikçiye \"Ciro Edildi\" olarak işaretlenirse o tedarikçiye olan borcunuz gerçekten azalır (kasaya dokunmaz).",
          "Verilen çek \"Ödendi\" olarak işaretlenirse seçtiğiniz kasa hesabından gerçek bir ödeme hareketi çıkar.",
          "\"Karşılıksız\" işaretlenen bir alınan çek, bağlı olduğu müşterinin kartına otomatik bir risk notu düşer — borç durumuna dokunmaz, bunu ayrıca siz yönetirsiniz.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Çek/senet portföyü kasadan bağımsız kendi başına bir takip sistemidir — bir çek aldığınızda müşteri borcunuzu otomatik azaltmaz (çünkü \"çek alınca mı yoksa tahsil edilince mi borç kapanır\" kararı işletmenizin kendi politikasıdır). İsterseniz tahsilatı ayrıca müşteri kartından da işleyebilirsiniz.",
      },
      { tur: "altbaslik", metin: "POS Mutabakat" },
      {
        tur: "paragraf",
        metin:
          "Finans > \"💳 POS Mutabakat\" sayfası, bir günde o POS hesabına giren kart tahsilatlarının toplamını (sistemden) otomatik hesaplar. Siz yalnızca bankadan gerçekte geçen tutarı girersiniz; aradaki fark POS komisyonu olarak otomatik bir gider kaydına ve o POS hesabının bakiyesinden gerçek bir düşüşe dönüşür — banka ekstresiyle sisteminiz her zaman eşleşir.",
      },
    ],
    ilgili: ["satis", "servisler", "ayarlar", "musteriler", "tedarikciler"],
  },
  {
    slug: "raporlar",
    baslik: "Raporlar",
    ikon: "📊",
    kategori: "modul",
    ozet: "Satış, servis, kârlılık, stok ve personel/prim performans raporları + tek tık muhasebeci Excel paketi.",
    anahtarKelimeler: ["rapor", "istatistik", "performans", "en çok satan", "tekrar eden", "kârlılık", "kar", "stok değeri", "muhasebeci", "excel", "prim", "personel"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Raporlar sayfası Satış, Servis, Kârlılık, Stok ve Personel/Prim olmak üzere beş sekmeden oluşur; Stok hariç her sekmede üstten bir tarih aralığı (son 7/30/90 gün veya son 1 yıl) seçersiniz, o sekmedeki rapor bu aralığa göre hesaplanır (Stok anlık bir görüntü olduğu için aralık seçimi orada gizlidir). Görüntüleme yetkisi Sahip, Yönetici ve Muhasebe rollerine tanımlıdır.",
      },
      { tur: "altbaslik", metin: "Satış Sekmesi" },
      {
        tur: "liste",
        ogeler: [
          "Özet kartlar: toplam satış tutarı, ortalama sepet, toplam iskonto (hem satır hem genel iskontoların toplamı) ve satış adedi.",
          "Günlük/Aylık Satış Serisi — \"Gün\"/\"Ay\" düğmesiyle gruplamayı değiştirebilirsiniz.",
          "En Çok Satan Ürünler — seçili aralıkta en yüksek ciro yapan ilk 10 ürün.",
          "Personel Performansı — her kullanıcının satış adedi, toplam tutarı ve ortalama iskonto oranı.",
        ],
      },
      { tur: "altbaslik", metin: "Servis Sekmesi" },
      {
        tur: "liste",
        ogeler: [
          "Toplam servis sayısı ve ortalama süre (kabulden teslime, yalnızca teslim edilmiş servisler üzerinden gün cinsinden hesaplanır).",
          "Teknisyen Performansı — her teknisyenin üstlendiği servis sayısı ve ortalama tamamlama süresi.",
          "Tekrar Eden Cihazlar — aynı cihaz birden fazla kez servise girmişse (seçtiğiniz tarih aralığından bağımsız, tüm zamanlar) burada listelenir; sık arızalanan bir cihaz veya kalıcı olarak çözülmemiş bir sorun olabileceğine işarettir.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "\"Bugünkü Tahsilat\" ile \"Toplam Satış\" arasındaki mantık Genel Bakış'takiyle aynıdır: açık hesap satışlar satış tutarına girer ama kasaya para girmediği için tahsilat rakamına girmez.",
      },
      { tur: "altbaslik", metin: "Kârlılık Sekmesi" },
      {
        tur: "paragraf",
        metin:
          "Bu sekme yalnızca Satış (POS) modülünü kapsar — servis gelirleri dahil değildir. İki maliyet yöntemi arasında seçim yapabilirsiniz: \"Satış Anındaki Maliyet\", her satış kaleminin o an geçerli olan ürün maliyetini (döviz cinsindense günün kuruyla TL'ye çevrilmiş hâliyle) donmuş olarak saklar — tarihsel olarak en doğru rakamdır. \"Güncel Maliyet\" ise geçmiş satışları da bugünkü ürün maliyetiyle yeniden hesaplar — \"bugünün maliyetiyle satsaydım kârım ne olurdu\" sorusuna cevap verir.",
      },
      {
        tur: "liste",
        ogeler: [
          "Özet kartlar: toplam ciro, toplam maliyet, toplam kâr ve kâr marjı (%).",
          "Ürün Bazlı Kârlılık — her ürünün adedi, cirosu, kâr marjı ve kâr tutarı, en kârlıdan başlayarak.",
          "İşçilik/hizmet kalemlerinin malzeme maliyeti yoktur, tamamı kâr olarak sayılır.",
        ],
      },
      {
        tur: "uyari",
        metin:
          "Tutarlar KDV dahildir (her satırın KDV oranı ayrıca saklanmadığı için net kâr hesabı için kendi KDV oranınızı düşünmeniz gerekir). \"Satış Anındaki Maliyet\" verisi 17 Ağustos 2026'dan önceki satışlarda yoktur — bu kalemler kâr toplamına dahil edilmez, sayfada kaç kalemin etkilendiği ayrıca gösterilir.",
      },
      { tur: "altbaslik", metin: "Stok Sekmesi" },
      {
        tur: "paragraf",
        metin:
          "Aktif tüm ürünlerin güncel maliyet (alış fiyatı × güncel kur × stok adedi) ve güncel satış değerini toplar, kategori bazında kırılım gösterir. Tarih aralığından bağımsız, o anki stok durumunun bir fotoğrafıdır.",
      },
      { tur: "altbaslik", metin: "Personel/Prim Sekmesi" },
      {
        tur: "paragraf",
        metin:
          "Prim, Ayarlar > Prim Kuralları'nda tanımladığınız kurala göre seçili dönem için canlı hesaplanır — ayrı bir prim kaydı/hareketi tutulmaz. Satış primi ciro veya kârlılık bazlı bir oran; teknisyen primi kapanan (teslim edilen) servis başına sabit bir tutar veya işçilik cirosu bazlı bir oran olabilir. İşçilik cirosu, bir servisin toplam tutarından kullanılan parçaların satış bedeli düşülerek yaklaşık hesaplanır.",
      },
      {
        tur: "uyari",
        metin:
          "Bu rapor bordroya VERİ SAĞLAR, bordro tutmaz — resmi bir maaş bordrosu veya ödeme kaydı değildir, yalnızca dönem sonu hesaplama kolaylığı sunar.",
      },
      { tur: "altbaslik", metin: "Muhasebeci Paketi (Excel)" },
      {
        tur: "paragraf",
        metin:
          "Sayfanın üstündeki ay seçiciden bir ay seçip \"📥 Muhasebeci Paketi (Excel)\" düğmesine bastığınızda, seçilen aya ait Özet, Satışlar, Giderler ve Kasa Hareketleri sayfalarını içeren tek bir .xlsx dosyası indirilir — ay sonu muhasebe teslimatı için ek bir işlem gerektirmez.",
      },
    ],
    ilgili: ["satis", "servisler", "genel-bakis", "stok"],
  },
  {
    slug: "ayarlar",
    baslik: "Ayarlar",
    ikon: "⚙️",
    kategori: "modul",
    ozet: "İşletme bilgileri, kullanıcı/rol yönetimi, döviz kurları, stok politikası, taksit limiti, abonelik ve eklentiler.",
    anahtarKelimeler: ["ayarlar", "eklenti", "döviz", "kur", "taksit", "işletme bilgisi", "abonelik", "dekont", "plan", "askıya alındı"],
    icerik: [
      { tur: "altbaslik", metin: "İşletme Bilgileri" },
      {
        tur: "paragraf",
        metin: "Logo, işletme adı, telefon ve adres bilgilerinizi buradan (Sahip/Yönetici) düzenlersiniz.",
      },
      { tur: "altbaslik", metin: "Kullanıcılar ve Davetler" },
      {
        tur: "paragraf",
        metin:
          "Personel davet etme ve rol değiştirme akışları için \"Roller ve Yetkiler\" kılavuz konusuna bakın.",
      },
      { tur: "altbaslik", metin: "Döviz Kurları" },
      {
        tur: "paragraf",
        metin:
          "TCMB kurları her gün otomatik güncellenir. Dilerseniz her para birimi için kendi \"dükkân kurunuzu\" girip TCMB kurunun önüne geçirebilirsiniz; bir dükkân kuru girildiğinde satırda \"Dükkân kuru aktif\" rozeti belirir. \"TCMB'ye dön\" ile istediğiniz zaman otomatik kura geri dönebilirsiniz.",
      },
      {
        tur: "ipucu",
        metin:
          "Kur değiştirdikten sonra dövizli maliyetle fiyatlanan ürünleriniz otomatik güncellenmez — \"Kur değişti mi? Etkilenen ürün fiyatlarını toplu güncelleyin\" bağlantısıyla Stok > Fiyat Güncelle sayfasına gidip uygulamanız gerekir.",
      },
      { tur: "altbaslik", metin: "Negatif Stok Politikası" },
      {
        tur: "tablo",
        basliklar: ["Seçenek", "Ne Olur"],
        satirlar: [
          ["Uyarılı", "Stok eksiye düşebilir; işlem tamamlanır, ekranda uyarı gösterilir."],
          ["Onaylı", "Stok eksiye düşecekse işlem öncesi açık onay istenir."],
          ["Yasak", "Stok yetersizse işlem tamamen engellenir."],
        ],
      },
      { tur: "altbaslik", metin: "Taksit Limiti" },
      {
        tur: "paragraf",
        metin: "Satış ekranında kart ödemelerinde önerilecek azami taksit sayısını burada belirlersiniz.",
      },
      { tur: "altbaslik", metin: "Servis Ayarları" },
      {
        tur: "paragraf",
        metin:
          "Teslimde önerilecek varsayılan garanti süresini (gün) ve \"Hazır\" durumundaki bir cihazın kaç gün beklenirse otomatik \"Teslim Alınmadı\" işaretleneceğini burada belirlersiniz.",
      },
      { tur: "altbaslik", metin: "Abonelik" },
      {
        tur: "paragraf",
        metin:
          "Mevcut planınızı (Başlangıç/Profesyonel/Kurumsal), faturalama döngünüzü (aylık/yıllık) ve deneme/ödeme durumunuzu buradan görürsünüz. Plan değişikliği, süre uzatma gibi işlemler ByteNova ekibi tarafından (Konsol'dan) yapılır — kendi başınıza plan yükseltemezsiniz, destek hattından talep etmeniz yeterlidir.",
      },
      {
        tur: "paragraf",
        metin:
          "Ödemenizi banka havalesi/EFT ile yaptıysanız \"📤 Ödeme Dekontu Yükle\" ile dekontunuzu (görsel veya PDF, azami 5 MB) buradan gönderebilirsiniz; ByteNova ekibi onayladığında aboneliğiniz otomatik olarak aktif hale gelir. Onay/red durumunu ve varsa red gerekçesini yine bu ekrandan takip edersiniz.",
      },
      {
        tur: "paragraf",
        metin:
          "\"Otomatik Ödeme\" bölümünden bir kart kaydederseniz (💳 Kart Ekle) dekont yüklemenize gerek kalmaz — deneme veya ödeme döneminiz bittiğinde ücret otomatik tahsil edilir ve aboneliğiniz kesintisiz devam eder. Tahsilat başarısız olursa (örn. kartınızın süresi dolmuşsa) mevcut dekont akışına otomatik döner, panel erişiminiz aynı kurallarla (grace period) korunur. Kartınızı istediğiniz zaman \"Kaldır\" ile silebilirsiniz.",
      },
      {
        tur: "uyari",
        metin:
          "Ödeme süresinde tamamlanmazsa (deneme bitiminden bir süre sonra) işletme paneliniz geçici olarak durur — \"Aboneliğiniz Beklemede\" ekranı görürsünüz. Verileriniz asla silinmez; dekont onaylanır onaylanmaz erişiminiz anında geri açılır.",
      },
      { tur: "altbaslik", metin: "Eklentiler" },
      {
        tur: "paragraf",
        metin:
          "PC Toplama, Kurumsal Satış (Teklifler + Sözleşmeler), e-Belge, Pazaryeri Entegrasyonu ve WhatsApp/SMS gibi ücretli ek modülleri bu bölümden inceler, etkinleştirir veya devre dışı bırakırsınız (Sahip/Yönetici). Menüde \"🔒 Eklenti\" rozeti gördüğünüz her modül buraya bağlıdır.",
      },
      { tur: "altbaslik", metin: "Destek" },
      {
        tur: "paragraf",
        metin: "Sayfanın en altındaki \"🟢 WhatsApp'tan Yazın\" butonuyla doğrudan ByteNova ekibine ulaşabilirsiniz.",
      },
    ],
    ilgili: ["roller-ve-yetkiler", "stok"],
  },

  // ================= REFERANS =================
  {
    slug: "sss",
    baslik: "Sık Sorulan Sorular",
    ikon: "❓",
    kategori: "referans",
    ozet: "Sık karşılaşılan durumlar ve çözümleri.",
    anahtarKelimeler: ["sss", "sorun", "hata", "yardım", "soru"],
    icerik: [
      {
        tur: "altbaslik",
        metin: "Bir satışta iskonto girdim ama sistem \"yönetici onayı gerekli\" diyor, ne yapmalıyım?",
      },
      {
        tur: "paragraf",
        metin:
          "Kasa Personeli rolü en fazla %10 iskontoyu kendi başına uygulayabilir. Daha yüksek bir iskonto için açılan pencerede bir Yönetici veya Sahip, kendi e-posta ve parolasını girerek onay verir — bu sırada sizin oturumunuz kapanmaz, satışa kaldığınız yerden devam edersiniz.",
      },
      { tur: "altbaslik", metin: "Kasayı yanlışlıkla kapattım (günsonu aldım), geri alabilir miyim?" },
      {
        tur: "paragraf",
        metin:
          "Hayır, işletme kullanıcıları kasa kapanışını kendi başlarına geri alamaz — bu, mali kayıtların bütünlüğünü korumak içindir. WhatsApp destek hattından ByteNova ekibine ulaşın; yetkili bir destek personeli kaydı inceleyip geri alır ve bu işlem hem sizin kasa geçmişinizde hem ByteNova'nın kendi kayıtlarında şeffafça görünür.",
      },
      { tur: "altbaslik", metin: "Bir üründe stok eksi görünüyor, bu normal mi?" },
      {
        tur: "paragraf",
        metin:
          "İşletmenizin negatif stok politikası \"Uyarılı\" ise evet, sistem işlemi engellemez ama sizi uyarır. Bunu önlemek isterseniz Ayarlar > Negatif Stok Politikası'ndan \"Onaylı\" veya \"Yasak\" seçeneğine geçebilirsiniz.",
      },
      { tur: "altbaslik", metin: "Bir müşteriyi veya cihazı tamamen silebilir miyim?" },
      {
        tur: "paragraf",
        metin:
          "Hayır — geçmiş satış, servis ve stok kayıtlarının bütünlüğünü korumak için sistemde kalıcı silme yoktur; müşteri kartlarını \"pasif\" duruma alabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Menüde bir modülün yanında \"Yakında\" ya da \"İnşada\" yazıyor, ne zaman açılacak?" },
      {
        tur: "paragraf",
        metin:
          "Bu modüller ByteNova'nın yol haritasında planlanmış ama henüz tamamlanmamış özelliklerdir. İlgili modüle tıkladığınızda çıkan tanıtım sayfasındaki \"Hazır olunca haber ver\" formunu doldurursanız, özellik yayınlandığında size bildirim gideriz.",
      },
      { tur: "altbaslik", metin: "Bir ekranda görüntü sorunu / hata görüyorum, ne yapmalıyım?" },
      {
        tur: "paragraf",
        metin:
          "Önce sayfayı yenilemeyi deneyin. Sorun devam ediyorsa Ayarlar sayfasının altındaki WhatsApp destek hattından bize bir ekran görüntüsüyle birlikte yazın — en kısa sürede inceleyip düzeltiriz.",
      },
    ],
    ilgili: ["finans", "satis", "stok"],
  },
  {
    slug: "teklifler",
    baslik: "Teklifler",
    ikon: "📄",
    kategori: "modul",
    ozet: "Kurumsal müşterilere PDF teklif hazırlama, QR ile online onay, kabul edilince tek tıkla satışa dönüştürme.",
    anahtarKelimeler: ["teklif", "kurumsal", "pdf", "qr", "onay", "fiyat teklifi"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Teklifler, \"Kurumsal Satış Paketi\" eklentisine bağlıdır (Ayarlar > Eklentiler'den etkinleştirilir). Kurumsal müşterilere ürün/işçilik/hizmet kalemlerinden oluşan, dövizli de olabilen fiyat teklifleri hazırlamanızı, PDF+QR ile paylaşmanızı ve kabul edilince tek tıkla gerçek bir satışa dönüştürmenizi sağlar.",
      },
      { tur: "altbaslik", metin: "Teklif Oluşturma" },
      {
        tur: "adimlar",
        adimlar: [
          "Teklifler > \"+ Yeni Teklif\" ile formu açın.",
          "Müşteriyi seçin (kurumsal müşteriler için Müşteriler modülünde \"Kurumsal\" tipini kullanmanız önerilir).",
          "Ürün arayıp ekleyin veya \"+ İşçilik/hizmet kalemi ekle\" ile serbest bir kalem (örn. kurulum, danışmanlık) girin.",
          "Para birimini (TRY/USD/EUR/GBP), geçerlilik süresini (gün) ve varsa genel iskontoyu belirleyin.",
          "\"Teklifi Oluştur\"a basın — otomatik bir teklif numarası üretilir (örnek: TK-2026-000123).",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Dövizli bir teklif oluşturduğunuzda kur, oluşturma anındaki güncel kurla donar — teklif süresi boyunca değişmez, tıpkı dövizli alışlardaki kur mantığı gibi.",
      },
      { tur: "altbaslik", metin: "Gönderme, PDF ve Online Onay" },
      {
        tur: "paragraf",
        metin:
          "Teklif detayında \"📄 PDF Görüntüle\" veya \"⬇️ İndir\" ile belgeyi alır, müşterinize e-posta/WhatsApp ile iletirsiniz. \"📤 Gönderildi Olarak İşaretle\"ye bastığınızda durum \"Gönderildi\"ye geçer. PDF'in sağ üstündeki QR kodu okutan müşteri, oturum açmadan teklifi görüntüleyip \"Kabul Ediyorum\" veya \"Reddediyorum\" diyebileceği bir sayfaya yönlenir — müşteri sayfayı ilk açtığında durum otomatik \"Müşteri İnceliyor\"a geçer.",
      },
      {
        tur: "paragraf",
        metin:
          "Müşteri kararını telefonla veya yüz yüze bildirdiyse, teklif detayındaki \"✓ Müşteri Kabul Etti\" veya \"✕ Müşteri Reddetti\" düğmeleriyle kararı siz de kaydedebilirsiniz — online onayla tamamen aynı sonucu üretir.",
      },
      { tur: "altbaslik", metin: "Satışa Dönüştürme" },
      {
        tur: "paragraf",
        metin:
          "Kabul edilen bir teklifte \"🧾 Satışa Dönüştür\" (Sahip/Yönetici) düğmesi belirir — basıldığında teklifteki tüm kalemlerle gerçek bir satış oluşturulur (ürün kalemleri stoktan düşer), tutar müşterinin açık hesabına borç olarak işlenir ve teklif o satışa bağlanır. Tahsilatı normal şekilde Finans veya satış detayından alırsınız.",
      },
      {
        tur: "uyari",
        metin:
          "Bir teklif yalnızca bir kez satışa dönüştürülebilir. Geçerlilik süresi dolan teklifler otomatik \"Süresi Doldu\" durumuna geçer ve artık karara açık olmaz — yeni bir teklif oluşturmanız gerekir.",
      },
    ],
    ilgili: ["satis", "musteriler", "ayarlar"],
  },
  {
    slug: "sozlesmeler",
    baslik: "Sözleşmeler",
    ikon: "📋",
    kategori: "modul",
    ozet: "Periyodik bakım sözleşmeleri: kapsam, SLA süresi, otomatik ziyaret takvimi ve bitiş hatırlatmaları.",
    anahtarKelimeler: ["sözleşme", "bakım", "sla", "ziyaret", "periyodik", "okul", "şirket"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Sözleşmeler, \"Kurumsal Satış Paketi\" eklentisine bağlıdır (Ayarlar > Eklentiler'den etkinleştirilir). Okul, şirket, belediye gibi müşterilere periyodik bakım hizmeti veriyorsanız — aylık sabit bedel, müdahale süresi (SLA) ve otomatik üretilen ziyaret takvimiyle bu ilişkiyi tek yerden yönetirsiniz.",
      },
      { tur: "altbaslik", metin: "Sözleşme Oluşturma" },
      {
        tur: "adimlar",
        adimlar: [
          "Sözleşmeler > \"+ Yeni Sözleşme\" ile formu açın.",
          "Müşteriyi seçin, sözleşme adını ve kapsamını (hangi cihazlar/işler dahil) girin.",
          "Ziyaret periyodunu (kaç ayda bir), aylık bedeli, SLA müdahale süresini (saat) ve başlangıç/bitiş tarihlerini girin.",
          "\"Sözleşmeyi Oluştur\"a basın — otomatik bir sözleşme numarası (örn. SOZ-2026-000001) ve başlangıç-bitiş aralığında, girdiğiniz periyotta tam bir ziyaret takvimi üretilir.",
        ],
      },
      {
        tur: "uyari",
        metin:
          "Faturalama günü yalnızca bilgi amaçlı bir alandır — sözleşmeden otomatik fatura/satış ÜRETİLMEZ. Her dönem için faturayı Satış modülünden kendiniz oluşturursunuz; bu, finansal belgelerin her zaman bir onaydan geçmesini sağlar.",
      },
      { tur: "altbaslik", metin: "Ziyaretleri Yönetme" },
      {
        tur: "paragraf",
        metin:
          "Sözleşme detayında her planlı ziyarete bir teknisyen atayabilir, ardından ziyaret gerçekleştiğinde \"✓ Ziyareti Tamamla\" ile bir rapor girip kaydedersiniz. Ziyaret sırasında kapsam dışı bir iş çıktıysa (örn. anakart değişimi) \"Kapsam dışı iş yapıldı\" kutusunu işaretleyin — bu iş sözleşme kapsamına dahil değildir, ayrıca ücretli bir servis kaydı açmanız gerekir (Servisler > Yeni Servis Kabul).",
      },
      {
        tur: "ipucu",
        metin:
          "Genel Bakış'ta sözleşmesi 30 gün içinde bitecek müşteri sayısını gösteren bir uyarı kartı belirir — bu, yenileme görüşmesi için müşteriyle iletişime geçmeniz gerektiğinin hatırlatıcısıdır. Süresi dolan sözleşmeler her gece otomatik olarak \"Süresi Doldu\" durumuna geçer.",
      },
      {
        tur: "paragraf",
        metin:
          "Sözleşmeyi erken sonlandırmanız gerekirse detay sayfasındaki \"Sözleşmeyi İptal Et\" ile kapatabilirsiniz — tamamlanmış ziyaretler geçmişte kalır, henüz gerçekleşmemiş planlı ziyaretler otomatik iptal edilir.",
      },
    ],
    ilgili: ["musteriler", "servisler", "ayarlar"],
  },
  {
    slug: "veri-ice-aktarma",
    baslik: "Veri İçe Aktarma (Excel)",
    ikon: "📥",
    kategori: "modul",
    ozet: "Müşteri, ürün, cihaz veya açık servis kayıtlarınızı bir .xlsx dosyasından toplu olarak aktarın.",
    anahtarKelimeler: ["excel", "içe aktar", "import", "toplu yükleme", "xlsx", "eski sistem", "veri aktarımı"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Eski bir programdan veya Excel tablosundan geçiş yapıyorsanız, kayıtlarınızı tek tek elle girmek yerine bir .xlsx dosyasıyla toplu aktarabilirsiniz. Ayarlar > \"Veri İçe Aktarma\" ile veya Müşteriler/Stok sayfalarındaki \"📥 İçe Aktar\" kısayoluyla sihirbaza ulaşırsınız.",
      },
      { tur: "altbaslik", metin: "Sihirbaz Nasıl Çalışır" },
      {
        tur: "adimlar",
        adimlar: [
          "Aktaracağınız veri türünü seçin: Müşteri, Ürün, Cihaz veya Açık Servis (geçmiş sistemden aktarım).",
          "İlk satırında sütun başlıkları olan bir .xlsx dosyası yükleyin (en fazla 5 MB, 2000 satır).",
          "Sistemin otomatik önerdiği sütun eşlemesini kontrol edin, gerekirse elle düzeltin (örn. \"Müşteri Adı\" sütununu \"Ad Soyad\" alanına eşleyin).",
          "İlk birkaç satırın önizlemesini kontrol edip \"İçe Aktar\"a basın.",
          "Sonuç ekranında her satırın başarılı mı yoksa hangi hatayla reddedildiği ayrı ayrı listelenir — bir satırdaki hata diğerlerini etkilemez.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Cihaz ve Açık Servis türleri, ilgili müşteriyi telefon numarasından bulur — önce müşterileri, sonra cihazları/servisleri aktarmanız önerilir. Açık Servis türünde cihaz seri numarası da verirseniz cihazla otomatik eşleştirilir.",
      },
      {
        tur: "uyari",
        metin:
          "İçe aktarma yalnızca yeni kayıt ekler, mevcut kayıtları güncellemez veya birleştirmez — aynı müşteriyi iki kez aktarırsanız iki ayrı kayıt oluşur. Büyük bir aktarım öncesi küçük bir örnek dosyayla deneme yapmanız önerilir.",
      },
    ],
    ilgili: ["musteriler", "stok", "ayarlar"],
  },
  {
    slug: "pc-toplama",
    baslik: "PC Toplama",
    ikon: "🖥️",
    kategori: "modul",
    ozet: "Reçeteyle (BOM) veya serbest parça listesiyle bilgisayar toplama, test checklist'i ve demontaj.",
    anahtarKelimeler: ["pc toplama", "bom", "reçete", "montaj", "toplama emri", "demontaj"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "PC Toplama, \"PC Toplama Paketi\" eklentisine bağlıdır (Ayarlar > Eklentiler'den etkinleştirilir). Sık topladığınız yapılandırmaları reçete olarak kaydedebilir, ya da her seferinde müşteriye özel serbest bir parça listesiyle toplama emri açabilirsiniz.",
      },
      { tur: "altbaslik", metin: "Reçete (BOM)" },
      {
        tur: "paragraf",
        metin:
          "PC Toplama > \"+ Reçete\" ile örneğin \"Oyun PC'si — Orta Segment\" gibi bir şablon oluşturursunuz: parça listesi (kasa, anakart, CPU, RAM, SSD, PSU, ekran kartı) ve montaj işçiliği tutarı. Yeni bir toplama emri açarken bu reçeteyi seçtiğinizde parça listesi otomatik doldurulur.",
      },
      { tur: "altbaslik", metin: "Toplama Emri Akışı" },
      {
        tur: "adimlar",
        adimlar: [
          "\"+ Yeni Toplama Emri\" ile bir reçete seçin veya serbest parça listesi oluşturun, isterseniz bir müşteriyle ilişkilendirin.",
          "\"Parçalar Rezerve\" olarak işaretlediğinizde tüm parçalar stoktan düşer.",
          "\"Montajda\" ve \"Test Ediliyor\" aşamalarında POST testi, stres testi ve sıcaklık kontrolü checklist'ini işaretleyin.",
          "\"Toplamayı Tamamla\" ile yeni ürüne bir ad ve satış fiyatı verin — sistem parça maliyetleri + işçilikten toplam maliyeti hesaplayıp seri numaralı, satışa hazır yeni bir stok kaydı oluşturur.",
        ],
      },
      {
        tur: "ipucu",
        metin:
          "Herhangi bir aşamada \"İptal Et\" ile emri iptal ederseniz o ana kadar rezerve edilmiş tüm parçalar otomatik olarak stoğa geri döner.",
      },
      { tur: "altbaslik", metin: "Demontaj" },
      {
        tur: "paragraf",
        metin:
          "PC Toplama > \"🔩 Demontaj\" iki senaryoyu kapsar: satılmadan kalan bir toplama PC'yi parçalarına ayırıp stoğa geri almak, veya hurdaya ayrılan/teslim alınmayan bir cihazdan sağlam parça hasat edip \"ikinci el parça\" olarak stoğa eklemek. Her iki durumda da hareket stok geçmişinde audit'li olarak görünür.",
      },
    ],
    ilgili: ["stok", "satis", "ayarlar"],
  },
  {
    slug: "belgeler",
    baslik: "Belgeler",
    ikon: "🗂️",
    kategori: "modul",
    ozet: "e-Fatura, e-Arşiv ve gider pusulası arşivi.",
    anahtarKelimeler: ["belgeler", "e-fatura", "e-arşiv", "gider pusulası", "arşiv"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Belgeler, \"e-Belge Paketi\" eklentisine bağlıdır (Ayarlar > Eklentiler'den etkinleştirilir). Kesilen tüm e-Fatura/e-Arşiv faturaları (Satış detayından) ve gider pusulaları (Tedarikçi detayından) burada tek arşivde listelenir — belgeler burada oluşturulmaz, yalnızca görüntülenir/indirilir.",
      },
      {
        tur: "ipucu",
        metin:
          "e-Fatura/e-Arşiv kesmek için Satış > ilgili satışın detayına gidip \"Sonra Kesilecek\" durumundaki bir satışta beliren e-Belge düğmelerini kullanın (kurumsal müşteri + VKN gerekir). Gider pusulası için Tedarikçiler > vergi mükellefi olmayan bir tedarikçinin detayına gidin.",
      },
      {
        tur: "uyari",
        metin:
          "Bu modüldeki e-Fatura/e-Arşiv kesimi gerçek bir GİB entegratör bağlantısı değildir (sandbox) — üretimde gerçek kullanım öncesi bir entegratörle (ve mali müşavirinizle) doğrulama yapılmalıdır. Küçük işletmeler için \"entegratörsüz mod\" (fişi/faturayı GİB portalinden elle kesip Satış detayından \"ÖKC Fişi\" olarak numarasını bağlama) her zaman kullanılabilir.",
      },
    ],
    ilgili: ["satis", "tedarikciler", "ayarlar"],
  },
  {
    slug: "bildirimler",
    baslik: "Bildirimler",
    ikon: "🔔",
    kategori: "modul",
    ozet: "Servis hazır olduğunda otomatik WhatsApp/SMS, manuel bildirim gönderimi ve İYS uyumlu pazarlama onayı.",
    anahtarKelimeler: ["bildirim", "whatsapp", "sms", "iys", "kampanya", "servis hazır"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Bildirimler, \"WhatsApp/SMS Paketi\" eklentisine bağlıdır (Ayarlar > Eklentiler'den etkinleştirilir). Müşterilerinize servis durumu bildirimleri ve kampanya mesajları göndermenizi, gönderim geçmişini tek ekrandan takip etmenizi sağlar.",
      },
      { tur: "altbaslik", metin: "Otomatik Bildirim" },
      {
        tur: "paragraf",
        metin:
          "Bir servis kaydının durumu \"Hazır\"a geçtiğinde, müşterinin telefon numarası kayıtlıysa sistem otomatik olarak bir WhatsApp bildirimi kuyruğa ekler — birkaç dakika içinde gönderilir. Herhangi bir işlem yapmanız gerekmez.",
      },
      { tur: "altbaslik", metin: "Manuel Bildirim Gönderme" },
      {
        tur: "adimlar",
        adimlar: [
          "Bildirimler sayfasında müşteriyi arayıp seçin.",
          "Kanalı (WhatsApp/SMS) ve bir şablon seçin — \"Serbest Metin\" ile kendi mesajınızı yazabilirsiniz.",
          "\"Gönder\"e basın — sandbox modunda mesaj anında \"Gönderildi\" olarak işaretlenir.",
        ],
      },
      { tur: "altbaslik", metin: "İYS ve Pazarlama Onayı" },
      {
        tur: "paragraf",
        metin:
          "\"Kampanya / Duyuru\" gibi pazarlama amaçlı şablonlar, Türkiye'deki İYS (İleti Yönetim Sistemi) düzenlemesi gereği yalnızca pazarlama mesajı onayı vermiş müşterilere gönderilebilir. Servis hazır bildirimi gibi operasyonel şablonlar bu onaya tabi değildir — bu ayrım her şablonda otomatik uygulanır, siz bir şey seçmenize gerek yoktur.",
      },
      {
        tur: "uyari",
        metin:
          "Onayı olmayan bir müşteriye kampanya mesajı göndermeyi denerseniz sistem işlemi engeller. Müşteri kartındaki \"Pazarlama mesajı onayı\" kutucuğunu yalnızca müşterinin gerçek rızası varsa işaretleyin.",
      },
    ],
    ilgili: ["musteriler", "servisler", "ayarlar"],
  },
  {
    slug: "yakinda",
    baslik: "Yakında Gelecek Modüller",
    ikon: "🗓️",
    kategori: "referans",
    ozet: "Yol haritasındaki modüller — sırayla açılacaklar.",
    anahtarKelimeler: ["yakında", "yol haritası", "teklif", "rapor", "satın alma talebi"],
    icerik: [
      {
        tur: "paragraf",
        metin:
          "Aşağıdaki modüller sol menüde görünür ama henüz kullanıma açılmamıştır; her biri ByteNova'nın yol haritasında planlanmış durumdadır. Menüden birine tıkladığınızda kısa bir tanıtım ve \"Hazır olunca haber ver\" formu görürsünüz.",
      },
      {
        tur: "tablo",
        basliklar: ["Modül", "Ne İşe Yarayacak"],
        satirlar: [
          ["🛒 Pazaryeri", "Trendyol, Hepsiburada, N11 stok senkronizasyonu. (Eklenti)"],
        ],
      },
      {
        tur: "ipucu",
        metin: "\"(Eklenti)\" ibaresi olan modüller ücretli ek paketlerdir; Ayarlar > Eklentiler'den mevcut paketleri inceleyebilirsiniz.",
      },
    ],
    ilgili: ["ayarlar"],
  },
];

export function kilavuzKonuBul(slug: string): KilavuzKonu | undefined {
  return KILAVUZ_KONULARI.find((k) => k.slug === slug);
}

export function kilavuzKategoriKonulari(kategori: KilavuzKategori): KilavuzKonu[] {
  return KILAVUZ_KONULARI.filter((k) => k.kategori === kategori);
}
