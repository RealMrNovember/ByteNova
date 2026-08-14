export const HAREKET_TIPLERI: Record<string, { etiket: string; ikon: string }> = {
  purchase: { etiket: "Alış", ikon: "🚚" },
  sale: { etiket: "Satış", ikon: "🧾" },
  service_use: { etiket: "Servis Kullanımı", ikon: "🔧" },
  return: { etiket: "İade", ikon: "↩️" },
  adjustment: { etiket: "Manuel Düzeltme", ikon: "✏️" },
  count: { etiket: "Sayım", ikon: "📋" },
  initial: { etiket: "Açılış Stoğu", ikon: "✨" },
};

export function hareketEtiket(tip: string): string {
  return HAREKET_TIPLERI[tip]?.etiket ?? tip;
}

export function hareketIkon(tip: string): string {
  return HAREKET_TIPLERI[tip]?.ikon ?? "•";
}

export const SOKULEN_PARCA_AKIBETI: Record<string, string> = {
  customer: "Müşteriye teslim edildi",
  disposed: "Dükkânda imhaya ayrıldı",
  scrap_stock: "Hurda parça stoğuna alındı",
};
