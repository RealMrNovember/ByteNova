"use server";

import { revalidatePath } from "next/cache";
import { createKonsolClient } from "@/lib/supabase/konsol-server";

export async function platformDavetiOlustur(email: string, rol: string) {
  const supabase = await createKonsolClient();

  const e = email.trim();
  if (!e) return { ok: false as const, hata: "E-posta zorunlu." };

  const { error } = await supabase.rpc("admin_platform_daveti_olustur", {
    p_email: e,
    p_role: rol,
  });

  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/konsol/adminler");
  return { ok: true as const };
}

export async function platformDavetiniIptal(id: string) {
  const supabase = await createKonsolClient();
  const { error } = await supabase.rpc("admin_platform_davetini_iptal", { p_id: id });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/konsol/adminler");
  return { ok: true as const };
}

export async function platformRoluDegistir(adminId: string, yeniRol: string) {
  const supabase = await createKonsolClient();
  const { error } = await supabase.rpc("admin_platform_rolunu_degistir", {
    p_admin_id: adminId,
    p_yeni_rol: yeniRol,
  });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/konsol/adminler");
  return { ok: true as const };
}

export async function platformAdminiKaldir(adminId: string) {
  const supabase = await createKonsolClient();
  const { error } = await supabase.rpc("admin_platform_admini_kaldir", { p_admin_id: adminId });
  if (error) return { ok: false as const, hata: error.message };
  revalidatePath("/konsol/adminler");
  return { ok: true as const };
}
