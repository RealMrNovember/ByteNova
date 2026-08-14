// Feature flag çözümleme: kod varsayılanı (menu.ts) + DB override'ları + eklenti kilidi.
// DB'deki feature_flags satırları: tenant_id null = global, dolu = tenant'a özel.
// Öncelik: tenant'a özel > global > kod varsayılanı.
// Eklenti kilidi: modül "aktif" (inşa edildi) + addonKey'i var + tenant'ın o eklentiye
// aktif/deneme aboneliği yoksa → "kilitli" (bkz. docs/EKLENTI_MIMARISI.md).

import type { SupabaseClient } from "@supabase/supabase-js";
import { PANEL_MENU, type MenuOgesi, type ModulDurum } from "./menu";
import { aktifMi, type EklentiAbonelikDurum } from "./eklenti";

type FlagStatus = "off" | "coming_soon" | "beta" | "on";

const durumEsle: Record<FlagStatus, ModulDurum> = {
  on: "aktif",
  beta: "insa",
  coming_soon: "yakinda",
  off: "yakinda",
};

export async function efektifMenu(
  supabase: SupabaseClient
): Promise<MenuOgesi[]> {
  const [{ data: flagData }, { data: abonelikData }] = await Promise.all([
    supabase.from("feature_flags").select("key, status, tenant_id"),
    supabase.from("tenant_addon_subscriptions").select("addon_key, status"),
  ]);

  const global = new Map<string, FlagStatus>();
  const tenantOzel = new Map<string, FlagStatus>();

  for (const f of flagData ?? []) {
    if (f.tenant_id === null) global.set(f.key, f.status as FlagStatus);
    else tenantOzel.set(f.key, f.status as FlagStatus);
  }

  const abonelikler = new Map<string, EklentiAbonelikDurum>();
  for (const a of abonelikData ?? []) {
    abonelikler.set(a.addon_key, a.status as EklentiAbonelikDurum);
  }

  return PANEL_MENU.map((m) => {
    const key = m.slug || "genel-bakis";
    const db = tenantOzel.get(key) ?? global.get(key);
    let durum = db ? durumEsle[db] : m.durum;

    // Modül inşa edildi ama ücretli eklentiye bağlıysa ve abonelik yoksa kilitle
    if (durum === "aktif" && m.addonKey && !aktifMi(abonelikler.get(m.addonKey))) {
      durum = "kilitli";
    }

    return { ...m, durum };
  });
}
