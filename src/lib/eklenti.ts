// Ücretli eklenti (add-on) yardımcıları — bkz. docs/EKLENTI_MIMARISI.md

export type EklentiPaketi = {
  key: string;
  name: string;
  description: string;
  icon: string;
  monthly_price: number | null;
  currency: string;
  billing_model: "flat" | "usage_based" | "flat_plus_usage";
  feature_keys: string[];
  sort_order: number;
};

export type EklentiAbonelikDurum = "trial" | "active" | "past_due" | "cancelled";

export type TenantEklentiAbonelik = {
  addon_key: string;
  status: EklentiAbonelikDurum;
  activated_at: string;
};

export function faturaModeliEtiket(model: string): string {
  switch (model) {
    case "usage_based":
      return "Kullanım bazlı";
    case "flat_plus_usage":
      return "Taban ücret + aşımda ek ücret";
    default:
      return "Aylık sabit ücret";
  }
}

export function fiyatGoster(paket: EklentiPaketi): string {
  if (paket.monthly_price == null) return "Fiyat için iletişime geçin";
  const tl = paket.monthly_price.toLocaleString("tr-TR");
  return paket.billing_model === "flat"
    ? `${tl} ${paket.currency}/ay`
    : `${tl} ${paket.currency}/ay'dan başlar`;
}

export function aktifMi(durum: EklentiAbonelikDurum | undefined): boolean {
  return durum === "active" || durum === "trial";
}
