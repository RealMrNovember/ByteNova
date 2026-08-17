import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TedarikciFormu } from "@/components/alis/TedarikciFormu";

export const metadata: Metadata = { title: "Yeni Tedarikçi — ByteNova" };

export default async function YeniTedarikciPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Yeni Tedarikçi</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Tedarikçi kartını oluşturun — alış faturaları buna bağlanacak.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <TedarikciFormu tenantId={profil?.tenant_id ?? ""} />
      </div>
    </div>
  );
}
