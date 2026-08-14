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
