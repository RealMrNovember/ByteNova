export const TALEP_KAYNAK_ETIKET: Record<string, { etiket: string; ikon: string }> = {
  servis: { etiket: "Servis", ikon: "🔧" },
  kritik_stok: { etiket: "Kritik Stok", ikon: "⚠️" },
  manuel: { etiket: "Manuel", ikon: "✍️" },
};

export const TALEP_DURUM_ETIKET: Record<string, { etiket: string; sinif: string }> = {
  bekliyor: { etiket: "Bekliyor", sinif: "bg-amber-500/15 text-amber-300" },
  siparis_edildi: { etiket: "Sipariş Edildi", sinif: "bg-sky-500/15 text-sky-300" },
  karsilandi: { etiket: "Karşılandı", sinif: "bg-emerald-500/15 text-emerald-300" },
  iptal: { etiket: "İptal", sinif: "bg-slate-500/15 text-slate-400" },
};

export function talepKaynakEtiket(kaynak: string): string {
  return TALEP_KAYNAK_ETIKET[kaynak]?.etiket ?? kaynak;
}

export function talepKaynakIkon(kaynak: string): string {
  return TALEP_KAYNAK_ETIKET[kaynak]?.ikon ?? "•";
}

export function talepDurumEtiket(durum: string): string {
  return TALEP_DURUM_ETIKET[durum]?.etiket ?? durum;
}

export function talepDurumSinifi(durum: string): string {
  return TALEP_DURUM_ETIKET[durum]?.sinif ?? TALEP_DURUM_ETIKET.bekliyor.sinif;
}
