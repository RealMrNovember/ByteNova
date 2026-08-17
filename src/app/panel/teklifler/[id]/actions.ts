"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function teklifiGonderildiIsaretle(teklifId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("teklif_gonderildi_isaretle", { p_teklif_id: teklifId });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/panel/teklifler/${teklifId}`);
  return { ok: true as const };
}

export async function teklifKarariKaydet(publicToken: string, karar: "kabul" | "reddedildi", not: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("teklif_musteri_karari", {
    p_token: publicToken,
    p_karar: karar,
    p_not: not.trim() || null,
  });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/panel/teklifler");
  return { ok: true as const };
}

export async function teklifiSatisaDonustur(teklifId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("teklif_satisa_donustur", { p_teklif_id: teklifId });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath(`/panel/teklifler/${teklifId}`);
  return { ok: true as const, saleId: data as string };
}
