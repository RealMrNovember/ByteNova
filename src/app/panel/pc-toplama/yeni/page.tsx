import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ToplamaEmriFormu } from "@/components/toplama/ToplamaEmriFormu";

export const metadata: Metadata = { title: "Yeni Toplama Emri — ByteNova" };

export default async function YeniToplamaEmriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();

  const { data: receteler } = await supabase
    .from("assembly_recipes")
    .select("id, name, labor_cost")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-white">Yeni Toplama Emri</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Bir reçete seçin veya müşteriye özel serbest bir parça listesi oluşturun.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <ToplamaEmriFormu tenantId={profil?.tenant_id ?? ""} receteler={receteler ?? []} />
      </div>
    </div>
  );
}
