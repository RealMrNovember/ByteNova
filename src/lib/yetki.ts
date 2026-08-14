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
  kasa_yonet: ["owner", "manager", "cashier"],
} as const;

export type Yetki = keyof typeof YETKILER;

export function yetkiVar(rol: string | null | undefined, yetki: Yetki): boolean {
  if (!rol) return false;
  return (YETKILER[yetki] as readonly string[]).includes(rol);
}

// Onaysız uygulanabilecek azami iskonto yüzdesi (rol bazlı).
// null = sınırsız (owner/manager). Bu sınır satis_olustur() RPC'sinde
// de aynı değerle tekrarlanır (public.satis_olustur — ISKONTO_ONAY_GEREKLI) —
// istemci tarafı yalnızca UX içindir, gerçek zorlama sunucu tarafındadır.
export const ISKONTO_LIMITLERI: Record<Rol, number | null> = {
  owner: null,
  manager: null,
  cashier: 10,
  technician: 0,
  warehouse: 0,
  accounting: 0,
};

export function iskontoLimiti(rol: string | null | undefined): number | null {
  if (!rol || !(rol in ISKONTO_LIMITLERI)) return 0;
  return ISKONTO_LIMITLERI[rol as Rol];
}
