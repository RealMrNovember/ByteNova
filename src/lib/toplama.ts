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

// PC Yapılandırıcı — sabit bileşen tipi taksonomisi. Kategori kategori gezinme ve
// yapılandırma slotları bu sabit listeye göre çalışır (tenant'ın kendi ürün
// kategorileri kurulu olmasa bile kutudan çıkar çıkmaz işler).
export type BilesenTipi =
  | "islemci"
  | "anakart"
  | "ram"
  | "depolama"
  | "ekran_karti"
  | "guc_kaynagi"
  | "kasa"
  | "sogutucu"
  | "diger";

export const BILESEN_TIPLERI: { deger: BilesenTipi; etiket: string; ikon: string }[] = [
  { deger: "islemci", etiket: "İşlemci", ikon: "🧠" },
  { deger: "anakart", etiket: "Anakart", ikon: "🔌" },
  { deger: "ram", etiket: "RAM", ikon: "📶" },
  { deger: "depolama", etiket: "Depolama", ikon: "💽" },
  { deger: "ekran_karti", etiket: "Ekran Kartı", ikon: "🎮" },
  { deger: "guc_kaynagi", etiket: "Güç Kaynağı", ikon: "🔋" },
  { deger: "kasa", etiket: "Kasa", ikon: "🖥️" },
  { deger: "sogutucu", etiket: "Soğutucu", ikon: "❄️" },
  { deger: "diger", etiket: "Diğer", ikon: "🔧" },
];

export function bilesenEtiket(deger: string | null): string {
  return BILESEN_TIPLERI.find((b) => b.deger === deger)?.etiket ?? "Diğer";
}

export function bilesenIkon(deger: string | null): string {
  return BILESEN_TIPLERI.find((b) => b.deger === deger)?.ikon ?? "🔧";
}

export const PLAN_DURUMLARI: Record<string, { etiket: string; sinif: string }> = {
  taslak: { etiket: "Taslak", sinif: "bg-slate-500/15 text-slate-300" },
  donusturuldu: { etiket: "Dönüştürüldü", sinif: "bg-emerald-500/15 text-emerald-300" },
  iptal: { etiket: "İptal", sinif: "bg-red-500/15 text-red-300" },
};

export function planDurumu(deger: string) {
  return PLAN_DURUMLARI[deger] ?? { etiket: deger, sinif: "bg-slate-500/15 text-slate-300" };
}
