"use server";

import { redirect } from "next/navigation";
import { createKonsolClient } from "@/lib/supabase/konsol-server";

export async function konsolCikisYap() {
  const supabase = await createKonsolClient();
  await supabase.auth.signOut();
  redirect("/konsol/giris");
}
