export const HESAP_TIPLERI: Record<string, { etiket: string; ikon: string }> = {
  nakit: { etiket: "Nakit", ikon: "💵" },
  banka: { etiket: "Banka", ikon: "🏦" },
  pos: { etiket: "POS", ikon: "💳" },
};

export function hesapEtiket(tip: string): string {
  return HESAP_TIPLERI[tip]?.etiket ?? tip;
}

export function hesapIkon(tip: string): string {
  return HESAP_TIPLERI[tip]?.ikon ?? "💰";
}

export const KASA_HAREKET_TIPLERI: Record<string, { etiket: string; ikon: string }> = {
  tahsilat: { etiket: "Tahsilat", ikon: "⬇️" },
  odeme: { etiket: "Ödeme", ikon: "⬆️" },
  transfer_giris: { etiket: "Transfer (Giriş)", ikon: "↘️" },
  transfer_cikis: { etiket: "Transfer (Çıkış)", ikon: "↗️" },
  acilis: { etiket: "Açılış Bakiyesi", ikon: "✨" },
  duzeltme: { etiket: "Düzeltme", ikon: "✏️" },
};

export function kasaHareketEtiket(tip: string): string {
  return KASA_HAREKET_TIPLERI[tip]?.etiket ?? tip;
}

export function kasaHareketIkon(tip: string): string {
  return KASA_HAREKET_TIPLERI[tip]?.ikon ?? "•";
}
