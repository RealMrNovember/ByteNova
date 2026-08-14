// Feature flag çözümleme: kod varsayılanı (menu.ts) + DB override'ları.
// DB'deki feature_flags satırları: tenant_id null = global, dolu = tenant'a özel.
// Öncelik: tenant'a özel > global > kod varsayılanı.

import type { SupabaseClient } from "@supabase/supabase-js";
import { PANEL_MENU, type MenuOgesi, type ModulDurum } from "./menu";

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
  const { data } = await supabase
    .from("feature_flags")
    .select("key, status, tenant_id");

  const global = new Map<string, FlagStatus>();
  const tenantOzel = new Map<string, FlagStatus>();

  for (const f of data ?? []) {
    if (f.tenant_id === null) global.set(f.key, f.status as FlagStatus);
    else tenantOzel.set(f.key, f.status as FlagStatus);
  }

  return PANEL_MENU.map((m) => {
    const key = m.slug || "genel-bakis";
    const db = tenantOzel.get(key) ?? global.get(key);
    return db ? { ...m, durum: durumEsle[db] } : m;
  });
}
