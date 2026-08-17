// Cari yaşlandırma (30/60/90) — fatura-fatura eşleştirme yapmadan
// (Gün 22'nin genel bakiye modeliyle uyumlu), FIFO varsayımıyla hesaplanan
// bir RAPOR fonksiyonu: en eski borçların önce kapandığı varsayılır.
// Cari modelin kendisini değiştirmez, yalnızca mevcut hareketleri okur.

export type YaslandirmaBucket = {
  g0_30: number;
  g31_60: number;
  g61_90: number;
  g90_plus: number;
};

export function yaslandirmaHesapla(
  hareketler: { amount: number | null; created_at: string }[],
  simdi: number = Date.now()
): YaslandirmaBucket {
  const kuyruk: { tutar: number; tarih: string }[] = [];

  for (const h of hareketler) {
    if (h.amount == null || h.amount === 0) continue; // kur farkı gibi tutar taşımayan satırlar
    if (h.amount > 0) {
      kuyruk.push({ tutar: h.amount, tarih: h.created_at });
      continue;
    }
    let kapatilacak = -h.amount;
    while (kapatilacak > 0.005 && kuyruk.length > 0) {
      const enEski = kuyruk[0];
      if (enEski.tutar <= kapatilacak + 0.005) {
        kapatilacak -= enEski.tutar;
        kuyruk.shift();
      } else {
        enEski.tutar -= kapatilacak;
        kapatilacak = 0;
      }
    }
  }

  const bucket: YaslandirmaBucket = { g0_30: 0, g31_60: 0, g61_90: 0, g90_plus: 0 };
  for (const b of kuyruk) {
    const gun = (simdi - new Date(b.tarih).getTime()) / (1000 * 60 * 60 * 24);
    if (gun <= 30) bucket.g0_30 += b.tutar;
    else if (gun <= 60) bucket.g31_60 += b.tutar;
    else if (gun <= 90) bucket.g61_90 += b.tutar;
    else bucket.g90_plus += b.tutar;
  }
  return bucket;
}

export function yaslandirmaToplam(b: YaslandirmaBucket): number {
  return b.g0_30 + b.g31_60 + b.g61_90 + b.g90_plus;
}
