"use server";

import { revalidatePath } from "next/cache";
import { createKonsolClient } from "@/lib/supabase/konsol-server";

export async function flagAyarla(key: string, status: string) {
  const supabase = await createKonsolClient();
  const { error } = await supabase.rpc("admin_flag_ayarla", { p_key: key, p_status: status });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/konsol/ayarlar");
  return { ok: true as const };
}

export async function paketDurumuDegistir(key: string, status: string) {
  const supabase = await createKonsolClient();
  const { error } = await supabase.rpc("admin_paket_durumu_degistir", { p_key: key, p_status: status });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/konsol/ayarlar");
  return { ok: true as const };
}
