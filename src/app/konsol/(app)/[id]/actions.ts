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
