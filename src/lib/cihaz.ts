export const CIHAZ_TURLERI = [
  { deger: "laptop", etiket: "Laptop", ikon: "💻" },
  { deger: "desktop", etiket: "Masaüstü", ikon: "🖥️" },
  { deger: "phone", etiket: "Telefon", ikon: "📱" },
  { deger: "tablet", etiket: "Tablet", ikon: "📲" },
  { deger: "console", etiket: "Konsol", ikon: "🎮" },
  { deger: "printer", etiket: "Yazıcı", ikon: "🖨️" },
  { deger: "monitor", etiket: "Monitör", ikon: "🖥" },
  { deger: "other", etiket: "Diğer", ikon: "🔌" },
] as const;

export function cihazIkon(tur: string): string {
  return CIHAZ_TURLERI.find((t) => t.deger === tur)?.ikon ?? "🔌";
}

export function cihazEtiket(tur: string): string {
  return CIHAZ_TURLERI.find((t) => t.deger === tur)?.etiket ?? tur;
}
