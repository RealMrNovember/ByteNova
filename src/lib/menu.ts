// Panel menüsünün tek kaynağı (feature registry).
// Menü, rozetler ve "Çok Yakında" ekranları buradan beslenir.
// durum: "aktif" = kullanılabilir, "insa" = bu sprintte yapılıyor,
//        "yakinda" = yol haritasında, "kilitli" = inşa edildi ama ücretli eklenti gerektiriyor.

export type ModulDurum = "aktif" | "insa" | "yakinda" | "kilitli";

export type MenuOgesi = {
  slug: string; // /panel/<slug> — boş string = /panel (Genel Bakış)
  ad: string;
  ikon: string;
  durum: ModulDurum;
  aciklama: string; // Çok Yakında / eklenti ekranında gösterilir
  addonKey?: string; // dolu ise bu modül bir addon_packages.key'e bağlıdır (bkz. docs/EKLENTI_MIMARISI.md)
};

export const PANEL_MENU: MenuOgesi[] = [
  {
    slug: "",
    ad: "Genel Bakış",
    ikon: "🏠",
    durum: "aktif",
    aciklama: "İşletmenizin bugünkü durumu: satış, tahsilat, açık servisler ve uyarılar.",
  },
  {
    slug: "servisler",
    ad: "Servisler",
    ikon: "🔧",
    durum: "aktif",
    aciklama:
      "Servis kabulünden teslime tüm süreç: fotoğraflı kabul, durum takibi, teknisyen atama, müşteri onayı, kapora ve teslim tutanağı.",
  },
  {
    slug: "satis",
    ad: "Satış",
    ikon: "🧾",
    durum: "yakinda",
    aciklama:
      "Klavye öncelikli hızlı satış: barkod okut, iskonto uygula, karma ödeme al, fiş/fatura seç. Gün 16-20'de aktif.",
  },
  {
    slug: "alis",
    ad: "Alış",
    ikon: "🚚",
    durum: "yakinda",
    aciklama:
      "Dövizli alış faturaları, tedarikçi takibi ve satın alma talepleri. Toptancıdan gelen mal stoğa tek akışla girer.",
  },
  {
    slug: "pc-toplama",
    ad: "PC Toplama",
    ikon: "🖥️",
    durum: "yakinda",
    aciklama:
      "Reçeteyle (BOM) parçalardan sistem topla: parçalar stoktan düşer, toplama PC kendi seri numarasıyla satışa hazır olur.",
    addonKey: "pc_toplama",
  },
  {
    slug: "stok",
    ad: "Stok",
    ikon: "📦",
    durum: "aktif",
    aciklama:
      "Her stok hareketinin nedeni belli: alış, satış, servis kullanımı, sayım. Kritik stok uyarıları ve kur bazlı fiyat güncelleme.",
  },
  {
    slug: "cihazlar",
    ad: "Cihazlar",
    ikon: "💻",
    durum: "aktif",
    aciklama:
      "Seri numarası bazlı cihaz envanteri: bu laptop hangi alıştan geldi, kime satıldı, kaç kez servise girdi — saniyede cevap.",
  },
  {
    slug: "musteriler",
    ad: "Müşteriler",
    ikon: "👥",
    durum: "aktif",
    aciklama:
      "Müşteri 360°: satın alımlar, servisler, cihazlar, bakiye ve iletişim geçmişi tek ekranda.",
  },
  {
    slug: "tedarikciler",
    ad: "Tedarikçiler",
    ikon: "🤝",
    durum: "yakinda",
    aciklama:
      "Tedarikçi kartları, dövizli cari bakiyeler, fiyat değişim geçmişi ve performans raporları.",
  },
  {
    slug: "teklifler",
    ad: "Teklifler",
    ikon: "📄",
    durum: "yakinda",
    aciklama:
      "Kurumsal müşterilere PDF teklif hazırla, QR ile onay al, kabul edilince tek tıkla satışa/iş emrine dönüştür.",
    addonKey: "kurumsal_satis",
  },
  {
    slug: "sozlesmeler",
    ad: "Sözleşmeler",
    ikon: "📋",
    durum: "yakinda",
    aciklama:
      "Periyodik bakım sözleşmeleri: SLA takibi, otomatik ziyaret planları ve yenileme hatırlatmaları.",
    addonKey: "kurumsal_satis",
  },
  {
    slug: "finans",
    ad: "Finans",
    ikon: "💰",
    durum: "yakinda",
    aciklama:
      "Kasa, tahsilat, giderler, çek/senet portföyü, POS mutabakatı ve kur yönetimi tek çatı altında.",
  },
  {
    slug: "belgeler",
    ad: "Belgeler",
    ikon: "🗂️",
    durum: "yakinda",
    aciklama:
      "e-Fatura, e-Arşiv, gider pusulası ve servis formları: tüm resmi ve operasyonel belgeler arşivde.",
    addonKey: "e_belge",
  },
  {
    slug: "raporlar",
    ad: "Raporlar",
    ikon: "📊",
    durum: "yakinda",
    aciklama:
      "Satış, kârlılık (maliyet yöntemi seçilebilir), servis performansı, stok değeri ve tek tık muhasebeci paketi.",
  },
  {
    slug: "pazaryeri",
    ad: "Pazaryeri",
    ikon: "🛒",
    durum: "yakinda",
    aciklama:
      "Trendyol, Hepsiburada ve N11 ile stok senkronu: dükkânda satılan ürün pazaryerinde de düşer.",
    addonKey: "pazaryeri",
  },
  {
    slug: "bildirimler",
    ad: "Bildirimler",
    ikon: "🔔",
    durum: "yakinda",
    aciklama:
      "Servis hazır, ödeme gecikti, kritik stok: WhatsApp/SMS bildirimleri ve İYS uyumlu kampanya yönetimi.",
    addonKey: "whatsapp_sms",
  },
  {
    slug: "ayarlar",
    ad: "Ayarlar",
    ikon: "⚙️",
    durum: "aktif",
    aciklama:
      "İşletme bilgileri, kullanıcılar ve roller, vergi kuralları, yazıcılar ve entegrasyonlar.",
  },
];

export function modulBul(slug: string): MenuOgesi | undefined {
  return PANEL_MENU.find((m) => m.slug === slug);
}
