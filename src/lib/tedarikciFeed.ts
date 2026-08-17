// Toptancı XML/B2B fiyat feed'i — sağlayıcı soyutlaması.
// Gerçek bir Penta/Index-Datagate/Arena B2B API kimlik bilgisi bu ortamda yok.
// SANDBOX_KATALOGLAR sabit, örnek bir parça listesi döner — gerçek entegrasyonda
// yalnızca katalogCek() gövdesi değişir (XML/REST çekip parse eder), geri kalan
// mimari (şema, eşleştirme, fiyat önerisi, senkron RPC'si) aynı kalır.

export type ToptanciSaglayici = "penta" | "index_datagate" | "arena";

export const TOPTANCI_SAGLAYICILAR: Record<ToptanciSaglayici, string> = {
  penta: "Penta (Sandbox)",
  index_datagate: "Index / Datagate (Sandbox)",
  arena: "Arena (Sandbox)",
};

export type FeedKalemi = {
  external_code: string;
  barcode: string | null;
  name: string;
  price: number;
  currency: string;
  stock_quantity: number;
};

const TABAN_KATALOG: Omit<FeedKalemi, "price" | "stock_quantity" | "currency">[] = [
  { external_code: "PN-RAM-16-DDR4", barcode: "0740617298538", name: "Kingston 16GB DDR4 3200MHz RAM" },
  { external_code: "PN-RAM-32-DDR5", barcode: "0740617331570", name: "Corsair Vengeance 32GB DDR5 5600MHz RAM" },
  { external_code: "PN-SSD-1TB-NVME", barcode: "0763649156518", name: "Samsung 980 1TB NVMe SSD" },
  { external_code: "PN-SSD-500-SATA", barcode: "0763649112118", name: "Kingston A400 500GB SATA SSD" },
  { external_code: "PN-PSU-650-80P", barcode: "0846813011234", name: "Corsair RM650 650W 80+ Gold PSU" },
  { external_code: "PN-MB-B760M", barcode: "4719331854221", name: "ASUS Prime B760M-A WiFi Anakart" },
  { external_code: "PN-CPU-I5-14400F", barcode: "5032037273813", name: "Intel Core i5-14400F İşlemci" },
  { external_code: "PN-GPU-RTX4060", barcode: "4719331875653", name: "ASUS Dual RTX 4060 8GB Ekran Kartı" },
  { external_code: "PN-CASE-MID-ATX", barcode: "0840353803217", name: "NZXT H510 Mid Tower Kasa" },
  { external_code: "PN-COOL-AIR-120", barcode: "4719331902021", name: "Cooler Master Hyper 212 CPU Soğutucu" },
];

// Sağlayıcı bazlı hafif fiyat/stok varyasyonu — her distribütörün kendi
// fiyat/stok verisi olduğu izlenimini vermek için (rastgele değil, deterministik).
const SAGLAYICI_CARPANI: Record<ToptanciSaglayici, number> = {
  penta: 1,
  index_datagate: 1.015,
  arena: 0.985,
};

/** Sandbox: gerçek bir distribütör API'sini çağırmaz, örnek bir katalog döner. */
export async function sandboxKatalogCek(saglayici: ToptanciSaglayici): Promise<FeedKalemi[]> {
  const carpan = SAGLAYICI_CARPANI[saglayici];
  return TABAN_KATALOG.map((k, i) => {
    const tabanFiyat = 8 + i * 11.5; // USD, ürün başına sabit taban
    const tabanStok = 5 + ((i * 7) % 40);
    return {
      ...k,
      price: Math.round(tabanFiyat * carpan * 100) / 100,
      currency: "USD",
      stock_quantity: tabanStok,
    };
  });
}
