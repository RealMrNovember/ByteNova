"use server";

import { revalidatePath } from "next/cache";
import { createKonsolClient } from "@/lib/supabase/konsol-server";

export async function kasaKapanisiniGeriAl(closingId: string, neden: string) {
  const supabase = await createKonsolClient();

  const gerekce = neden.trim();
  if (!gerekce) return { ok: false as const, hata: "Gerekçe zorunlu." };

  const { error } = await supabase.rpc("admin_kasa_kapanisini_geri_al", {
    p_closing_id: closingId,
    p_neden: gerekce,
  });

  if (error) return { ok: false as const, hata: "Kapanış geri alınamadı." };

  revalidatePath("/konsol");
  return { ok: true as const };
}

export async function tenantUzat(tenantId: string, yeniBitis: string, gerekce: string) {
  const supabase = await createKonsolClient();

  const g = gerekce.trim();
  if (!g) return { ok: false as const, hata: "Gerekçe zorunlu." };
  if (!yeniBitis) return { ok: false as const, hata: "Yeni bitiş tarihi seçin." };

  const { error } = await supabase.rpc("admin_tenant_uzat", {
    p_tenant_id: tenantId,
    p_yeni_bitis: new Date(yeniBitis).toISOString(),
    p_gerekce: g,
  });

  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/konsol/${tenantId}`);
  return { ok: true as const };
}

export async function tenantDurumDegistir(tenantId: string, yeniDurum: "active" | "suspended", gerekce: string) {
  const supabase = await createKonsolClient();

  const g = gerekce.trim();
  if (yeniDurum === "suspended" && !g) {
    return { ok: false as const, hata: "Askıya alma için gerekçe zorunlu." };
  }

  const { error } = await supabase.rpc("admin_tenant_durum_degistir", {
    p_tenant_id: tenantId,
    p_yeni_durum: yeniDurum,
    p_gerekce: g || null,
  });

  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/konsol/${tenantId}`);
  return { ok: true as const };
}

export async function tenantPlanDegistir(
  tenantId: string,
  planId: string,
  donem: "aylik" | "yillik",
  gerekce: string
) {
  const supabase = await createKonsolClient();

  const g = gerekce.trim();
  if (!g) return { ok: false as const, hata: "Gerekçe zorunlu." };

  const { error } = await supabase.rpc("admin_tenant_plan_degistir", {
    p_tenant_id: tenantId,
    p_plan_id: planId,
    p_donem: donem,
    p_gerekce: g,
  });

  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/konsol/${tenantId}`);
  return { ok: true as const };
}

export async function dekontOnayla(receiptId: string, tenantId: string) {
  const supabase = await createKonsolClient();

  const { error } = await supabase.rpc("admin_dekont_onayla", { p_receipt_id: receiptId });

  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/konsol/${tenantId}`);
  return { ok: true as const };
}

export async function dekontReddet(receiptId: string, tenantId: string, gerekce: string) {
  const supabase = await createKonsolClient();

  const g = gerekce.trim();
  if (!g) return { ok: false as const, hata: "Red gerekçesi zorunlu." };

  const { error } = await supabase.rpc("admin_dekont_reddet", {
    p_receipt_id: receiptId,
    p_gerekce: g,
  });

  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/konsol/${tenantId}`);
  return { ok: true as const };
}
