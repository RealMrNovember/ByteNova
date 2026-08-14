// Rol ve yetki matrisi — tek kaynak.
// DB'deki profiles.role değerleriyle birebir aynı anahtarlar kullanılır.

export type Rol =
  | "owner"
  | "manager"
  | "cashier"
  | "technician"
  | "warehouse"
  | "accounting";

export const ROL_ADLARI: Record<Rol, string> = {
  owner: "İşletme Sahibi",
  manager: "Yönetici",
  cashier: "Kasa Personeli",
  technician: "Teknisyen",
  warehouse: "Depo Personeli",
  accounting: "Muhasebe",
};

// Davet edilebilir roller (owner yalnız kayıtla oluşur)
export const DAVET_ROLLERI: Rol[] = [
  "manager",
  "cashier",
  "technician",
  "warehouse",
  "accounting",
];

const YETKILER = {
  kullanici_yonet: ["owner"],
  davet_gonder: ["owner", "manager"],
  ayar_yonet: ["owner", "manager"],
  isletme_duzenle: ["owner", "manager"],
  maliyet_gor: ["owner", "manager", "accounting"],
  rapor_gor: ["owner", "manager", "accounting"],
  satis_yap: ["owner", "manager", "cashier"],
  servis_yonet: ["owner", "manager", "technician"],
  stok_yonet: ["owner", "manager", "warehouse"],
} as const;

export type Yetki = keyof typeof YETKILER;

export function yetkiVar(rol: string | null | undefined, yetki: Yetki): boolean {
  if (!rol) return false;
  return (YETKILER[yetki] as readonly string[]).includes(rol);
}
