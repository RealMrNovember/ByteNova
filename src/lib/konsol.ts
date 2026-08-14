// Platform Konsolu yardımcıları — bkz. proje dosyası Bölüm 63-68

export const TENANT_DURUMLARI: Record<string, { etiket: string; sinif: string }> = {
  trial: { etiket: "Deneme", sinif: "bg-amber-500/15 text-amber-300" },
  active: { etiket: "Aktif", sinif: "bg-emerald-500/15 text-emerald-300" },
  past_due: { etiket: "Ödeme Bekliyor", sinif: "bg-red-500/15 text-red-300" },
  suspended: { etiket: "Askıda", sinif: "bg-slate-500/15 text-slate-400" },
  cancelled: { etiket: "İptal", sinif: "bg-slate-500/15 text-slate-500" },
};

export function tenantDurum(status: string) {
  return TENANT_DURUMLARI[status] ?? TENANT_DURUMLARI.trial;
}

export type TenantSatiri = {
  id: string;
  name: string;
  status: string;
  phone: string | null;
  trial_ends_at: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  kullanici_sayisi: number;
};
