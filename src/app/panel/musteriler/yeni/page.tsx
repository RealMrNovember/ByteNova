import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MusteriFormu } from "@/components/musteri/MusteriFormu";

export const metadata: Metadata = { title: "Yeni Müşteri — ByteNova" };

export default async function YeniMusteriPage() {
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
      <h1 className="text-xl font-bold text-white">Yeni Müşteri</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Bireysel veya kurumsal müşteri kartı oluşturun.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <MusteriFormu tenantId={profil?.tenant_id ?? ""} />
      </div>
    </div>
  );
}
