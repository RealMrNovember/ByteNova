// Teklif modülü sabitleri — DB check constraint'iyle birebir aynı değerler.

export const TEKLIF_DURUMLARI: Record<string, { etiket: string; sinif: string }> = {
  taslak: { etiket: "Taslak", sinif: "bg-slate-500/15 text-slate-300" },
  gonderildi: { etiket: "Gönderildi", sinif: "bg-sky-500/15 text-sky-300" },
  musteri_inceliyor: { etiket: "Müşteri İnceliyor", sinif: "bg-amber-500/15 text-amber-300" },
  kabul: { etiket: "Kabul Edildi", sinif: "bg-emerald-500/15 text-emerald-300" },
  reddedildi: { etiket: "Reddedildi", sinif: "bg-red-500/15 text-red-300" },
  suresi_doldu: { etiket: "Süresi Doldu", sinif: "bg-slate-500/15 text-slate-500" },
};

export function teklifDurumu(status: string) {
  return TEKLIF_DURUMLARI[status] ?? TEKLIF_DURUMLARI.taslak;
}
