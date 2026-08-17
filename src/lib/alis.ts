export const ODEME_DURUMLARI: Record<string, { etiket: string; sinif: string }> = {
  odenmedi: { etiket: "Ödenmedi", sinif: "bg-red-500/15 text-red-300" },
  kismi: { etiket: "Kısmi Ödendi", sinif: "bg-amber-500/15 text-amber-300" },
  odendi: { etiket: "Ödendi", sinif: "bg-emerald-500/15 text-emerald-300" },
};

export function odemeDurumEtiket(deger: string): string {
  return ODEME_DURUMLARI[deger]?.etiket ?? deger;
}

export function odemeDurumSinifi(deger: string): string {
  return ODEME_DURUMLARI[deger]?.sinif ?? ODEME_DURUMLARI.odenmedi.sinif;
}
