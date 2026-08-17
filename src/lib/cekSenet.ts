export type CekYon = "alinan" | "verilen";
export type CekTip = "cek" | "senet";
export type CekDurum = "portfoyde" | "bankaya_verildi" | "tahsil_edildi" | "karsiliksiz" | "ciro_edildi" | "odendi";

export const DURUM_ETIKETLERI: Record<CekDurum, string> = {
  portfoyde: "Portföyde",
  bankaya_verildi: "Bankaya Verildi",
  tahsil_edildi: "Tahsil Edildi",
  karsiliksiz: "Karşılıksız",
  ciro_edildi: "Ciro Edildi",
  odendi: "Ödendi",
};

export const DURUM_SINIFLARI: Record<CekDurum, string> = {
  portfoyde: "bg-slate-500/15 text-slate-300",
  bankaya_verildi: "bg-amber-500/15 text-amber-300",
  tahsil_edildi: "bg-emerald-500/15 text-emerald-300",
  karsiliksiz: "bg-red-500/15 text-red-300",
  ciro_edildi: "bg-purple-500/15 text-purple-300",
  odendi: "bg-emerald-500/15 text-emerald-300",
};

// Her yön için mantıklı sonraki durumlar (portföyde her zaman başlangıç).
export function sonrakiDurumlar(yon: CekYon, mevcut: CekDurum): CekDurum[] {
  if (yon === "alinan") {
    const hepsi: CekDurum[] = ["portfoyde", "bankaya_verildi", "tahsil_edildi", "ciro_edildi", "karsiliksiz"];
    return hepsi.filter((d) => d !== mevcut);
  }
  const hepsi: CekDurum[] = ["portfoyde", "odendi", "karsiliksiz"];
  return hepsi.filter((d) => d !== mevcut);
}

export function tipEtiket(tip: CekTip) {
  return tip === "cek" ? "Çek" : "Senet";
}

export function vadeDurumu(vade: string): "gecmis" | "yakin" | "normal" {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const vadeTarihi = new Date(`${vade}T00:00:00`);
  const gunFarki = Math.round((vadeTarihi.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
  if (gunFarki < 0) return "gecmis";
  if (gunFarki <= 7) return "yakin";
  return "normal";
}
