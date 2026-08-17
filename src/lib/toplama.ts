export type ToplamaDurum = "taslak" | "parca_rezerve" | "montajda" | "test_ediliyor" | "tamamlandi" | "iptal";

export const DURUM_ETIKETLERI: Record<ToplamaDurum, string> = {
  taslak: "Taslak",
  parca_rezerve: "Parçalar Rezerve",
  montajda: "Montajda",
  test_ediliyor: "Test Ediliyor",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const DURUM_SINIFLARI: Record<ToplamaDurum, string> = {
  taslak: "bg-slate-500/15 text-slate-300",
  parca_rezerve: "bg-amber-500/15 text-amber-300",
  montajda: "bg-amber-500/15 text-amber-300",
  test_ediliyor: "bg-nova-500/15 text-nova-300",
  tamamlandi: "bg-emerald-500/15 text-emerald-300",
  iptal: "bg-red-500/15 text-red-300",
};

export function sonrakiAdim(durum: ToplamaDurum): ToplamaDurum | null {
  const sira: ToplamaDurum[] = ["taslak", "parca_rezerve", "montajda", "test_ediliyor", "tamamlandi"];
  const i = sira.indexOf(durum);
  if (i === -1 || i === sira.length - 1) return null;
  return sira[i + 1];
}
