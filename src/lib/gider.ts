export const GIDER_KATEGORILERI: Record<string, { etiket: string; ikon: string }> = {
  kira: { etiket: "Kira", ikon: "🏠" },
  fatura: { etiket: "Elektrik/Su/İnternet", ikon: "💡" },
  maas: { etiket: "Maaş", ikon: "👥" },
  yemek: { etiket: "Yemek", ikon: "🍽️" },
  kargo: { etiket: "Kargo", ikon: "📦" },
  pos_komisyonu: { etiket: "POS Komisyonu", ikon: "💳" },
  dis_servis: { etiket: "Dış Servis", ikon: "🔧" },
  sarf: { etiket: "Sarf Malzeme", ikon: "🧰" },
  vergi_harc: { etiket: "Vergi/Harç", ikon: "🧾" },
  diger: { etiket: "Diğer", ikon: "•" },
};

export function giderKategoriEtiket(kategori: string): string {
  return GIDER_KATEGORILERI[kategori]?.etiket ?? kategori;
}

export function giderKategoriIkon(kategori: string): string {
  return GIDER_KATEGORILERI[kategori]?.ikon ?? "💸";
}
