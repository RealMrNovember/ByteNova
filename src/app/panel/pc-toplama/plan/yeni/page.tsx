import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PcPlaniFormu } from "@/components/toplama/PcPlaniFormu";

export const metadata: Metadata = { title: "Yeni PC Planı — ByteNova" };

export default async function YeniPcPlaniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-white">🌐 Yeni PC Planı</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Stok gerektirmeden, kategori kategori bileşen seçip müşteriye anında fiyat verin.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <PcPlaniFormu tenantId={profil?.tenant_id ?? ""} />
      </div>
    </div>
  );
}
