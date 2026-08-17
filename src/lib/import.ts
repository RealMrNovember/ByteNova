// Excel import sihirbazı — hedef alan tanımları tek kaynak.

export type ImportAlani = { key: string; etiket: string; zorunlu: boolean };

export type ImportTuru = "musteri" | "urun" | "cihaz" | "servis";

export const IMPORT_TURLERI: Record<ImportTuru, { ad: string; ikon: string; aciklama: string; alanlar: ImportAlani[] }> = {
  musteri: {
    ad: "Müşteri",
    ikon: "🙋",
    aciklama: "Ad, telefon, adres ve vergi bilgileriyle toplu müşteri kaydı.",
    alanlar: [
      { key: "name", etiket: "Ad Soyad / Firma Unvanı", zorunlu: true },
      { key: "phone", etiket: "Telefon", zorunlu: false },
      { key: "email", etiket: "E-posta", zorunlu: false },
      { key: "address", etiket: "Adres", zorunlu: false },
      { key: "tax_office", etiket: "Vergi Dairesi", zorunlu: false },
      { key: "tax_number", etiket: "VKN / TCKN", zorunlu: false },
      { key: "notes", etiket: "Not", zorunlu: false },
    ],
  },
  urun: {
    ad: "Ürün",
    ikon: "📦",
    aciklama: "Ürün kartı + açılış stok miktarıyla toplu ürün kaydı.",
    alanlar: [
      { key: "name", etiket: "Ürün Adı", zorunlu: true },
      { key: "sku", etiket: "SKU", zorunlu: false },
      { key: "barcode", etiket: "Barkod", zorunlu: false },
      { key: "brand", etiket: "Marka", zorunlu: false },
      { key: "purchase_price", etiket: "Alış Fiyatı (TL)", zorunlu: false },
      { key: "sale_price", etiket: "Satış Fiyatı (TL)", zorunlu: false },
      { key: "stock_quantity", etiket: "Açılış Stok Miktarı", zorunlu: false },
      { key: "critical_stock", etiket: "Kritik Stok Seviyesi", zorunlu: false },
    ],
  },
  cihaz: {
    ad: "Cihaz",
    ikon: "💻",
    aciklama: "Var olan bir müşteriye bağlı cihaz kaydı (müşteri telefonuyla eşleştirilir).",
    alanlar: [
      { key: "musteri_telefon", etiket: "Müşteri Telefonu (eşleştirme için)", zorunlu: true },
      {
        key: "device_type",
        etiket: "Cihaz Türü (laptop/desktop/phone/tablet/console/printer/monitor/other)",
        zorunlu: true,
      },
      { key: "brand", etiket: "Marka", zorunlu: false },
      { key: "model", etiket: "Model", zorunlu: false },
      { key: "serial_no", etiket: "Seri No", zorunlu: false },
    ],
  },
  servis: {
    ad: "Açık Servis (geçmiş sistemden aktarım)",
    ikon: "🔧",
    aciklama: "Önceki sisteminizden devam eden açık servis kayıtları — önce müşteri ve cihaz aktarılmış olmalı.",
    alanlar: [
      { key: "musteri_telefon", etiket: "Müşteri Telefonu (eşleştirme için)", zorunlu: true },
      { key: "cihaz_seri_no", etiket: "Cihaz Seri No (varsa, eşleştirme için)", zorunlu: false },
      { key: "declared_issue", etiket: "Arıza Beyanı", zorunlu: true },
      {
        key: "status",
        etiket: "Durum (kabul_edildi/incelemede/onariliyor/parca_bekleniyor/hazir vb. — boşsa kabul_edildi)",
        zorunlu: false,
      },
    ],
  },
};

export const GECERLI_CIHAZ_TURLERI = [
  "laptop",
  "desktop",
  "phone",
  "tablet",
  "console",
  "printer",
  "monitor",
  "other",
];
