// Barkod → ürün bilgisi sorgulama — sağlayıcı soyutlaması.
// Varsayılan sağlayıcı UPCitemdb'nin anahtarsız "trial" uç noktasıdır
// (günlük sorgu sınırı vardır, kurulum gerektirmez). BARKOD_API_ANAHTARI
// ortam değişkeni tanımlanırsa aynı sağlayıcının anahtarlı/ücretli uç
// noktasına otomatik geçilir — ileride farklı bir sağlayıcıya geçmek
// gerekirse değiştirilecek tek yer burasıdır.

export type BarkodSonucu = {
  bulundu: boolean;
  ad: string | null;
  marka: string | null;
  kategori: string | null;
  resimUrl: string | null;
  kaynak: string | null;
};

const BOS_SONUC: BarkodSonucu = {
  bulundu: false,
  ad: null,
  marka: null,
  kategori: null,
  resimUrl: null,
  kaynak: null,
};

// EAN-8, UPC-A/EAN-13, GTIN-14 — barkod sağlayıcılarının kabul ettiği aralık
const BARKOD_FORMATI = /^\d{8}$|^\d{12,14}$/;

export function barkodGecerliMi(barkod: string): boolean {
  return BARKOD_FORMATI.test(barkod.trim());
}

export async function barkodSorgula(barkod: string): Promise<BarkodSonucu> {
  const temiz = barkod.trim();
  if (!barkodGecerliMi(temiz)) return BOS_SONUC;

  const anahtar = process.env.BARKOD_API_ANAHTARI;
  const url = anahtar
    ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${temiz}`
    : `https://api.upcitemdb.com/prod/trial/lookup?upc=${temiz}`;

  try {
    const yanit = await fetch(url, {
      headers: anahtar ? { user_key: anahtar, key_type: "3scale" } : {},
      signal: AbortSignal.timeout(6000),
    });
    if (!yanit.ok) return BOS_SONUC;

    const veri = (await yanit.json()) as {
      items?: { title?: string; brand?: string; category?: string; images?: string[] }[];
    };
    const urun = veri.items?.[0];
    if (!urun) return BOS_SONUC;

    return {
      bulundu: true,
      ad: urun.title?.trim() || null,
      marka: urun.brand?.trim() || null,
      kategori: urun.category?.trim() || null,
      resimUrl: urun.images?.[0] ?? null,
      kaynak: "upcitemdb",
    };
  } catch {
    // Ağ hatası, zaman aşımı veya günlük kota dolması — kullanıcıyı
    // engellemeden sessizce "bulunamadı" davranışına düşer, elle giriş
    // her zaman mümkündür.
    return BOS_SONUC;
  }
}
