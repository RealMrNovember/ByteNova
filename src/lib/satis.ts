export const KALEM_TIPLERI: Record<string, { etiket: string; ikon: string }> = {
  urun: { etiket: "Ürün", ikon: "📦" },
  iscilik: { etiket: "İşçilik", ikon: "🔧" },
  hizmet: { etiket: "Hizmet", ikon: "✨" },
};

export const ODEME_YONTEMLERI: Record<string, string> = {
  nakit: "Nakit",
  kart: "Kart",
  acik_hesap: "Açık Hesap",
};

export const ODEME_YONTEMLERI_KARMA: Record<string, string> = {
  ...ODEME_YONTEMLERI,
  karma: "Karma",
};

export function kalemEtiket(tip: string): string {
  return KALEM_TIPLERI[tip]?.etiket ?? tip;
}

export function kalemIkon(tip: string): string {
  return KALEM_TIPLERI[tip]?.ikon ?? "•";
}

export const BELGE_TIPLERI: Record<string, string> = {
  okc_fisi: "ÖKC Fişi",
  sonra_kesilecek: "Sonra Kesilecek",
};

export const IADE_SONUCLARI: Record<string, { etiket: string; ikon: string }> = {
  satilabilir: { etiket: "Satılabilir", ikon: "✅" },
  arizali: { etiket: "Arızalı", ikon: "⚠️" },
  hurda: { etiket: "Hurda", ikon: "🗑️" },
  servise: { etiket: "Servise Yönlendirildi", ikon: "🔧" },
};

export function iadeSonucEtiket(sonuc: string): string {
  return IADE_SONUCLARI[sonuc]?.etiket ?? sonuc;
}

export function iadeSonucIkon(sonuc: string): string {
  return IADE_SONUCLARI[sonuc]?.ikon ?? "•";
}
