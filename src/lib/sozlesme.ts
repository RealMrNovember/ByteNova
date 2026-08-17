// Bakım Sözleşmeleri modülü sabitleri — tek kaynak.
// DB check constraint'leriyle birebir aynı değerler kullanılır.

export const SOZLESME_DURUMLARI: Record<string, { etiket: string; sinif: string }> = {
  aktif: { etiket: "Aktif", sinif: "bg-emerald-500/15 text-emerald-300" },
  suresi_doldu: { etiket: "Süresi Doldu", sinif: "bg-slate-500/15 text-slate-400" },
  iptal: { etiket: "İptal", sinif: "bg-red-500/15 text-red-300" },
};

export function sozlesmeDurumu(deger: string) {
  return SOZLESME_DURUMLARI[deger] ?? { etiket: deger, sinif: "bg-slate-500/15 text-slate-400" };
}

export const ZIYARET_DURUMLARI: Record<string, { etiket: string; sinif: string }> = {
  planlandi: { etiket: "Planlandı", sinif: "bg-sky-500/15 text-sky-300" },
  tamamlandi: { etiket: "Tamamlandı", sinif: "bg-emerald-500/15 text-emerald-300" },
  iptal: { etiket: "İptal", sinif: "bg-slate-500/15 text-slate-400" },
};

export function ziyaretDurumu(deger: string) {
  return ZIYARET_DURUMLARI[deger] ?? { etiket: deger, sinif: "bg-slate-500/15 text-slate-400" };
}

/** SLA saatini okunabilir bir metne çevirir (48 saat → "2 iş günü" gibi basit bir yaklaşım değil, doğrudan saat/gün gösterir). */
export function slaMetni(saat: number | null): string {
  if (saat == null) return "—";
  if (saat % 24 === 0) return `${saat / 24} gün`;
  return `${saat} saat`;
}

export function sozlesmeBitisineKalanGun(bitisTarihi: string): number {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const bitis = new Date(`${bitisTarihi}T00:00:00`);
  return Math.round((bitis.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
}
