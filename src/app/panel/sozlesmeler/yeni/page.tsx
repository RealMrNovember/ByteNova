import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { SozlesmeFormu } from "@/components/sozlesme/SozlesmeFormu";

export const metadata: Metadata = { title: "Yeni Sözleşme — ByteNova" };

export default async function YeniSozlesmePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("tenant_id, role").eq("id", user.id).single();
  if (!yetkiVar(profil?.role, "teklif_yonet")) redirect("/panel/sozlesmeler");

  const { data: paket } = await supabase
    .from("tenant_addon_subscriptions")
    .select("status")
    .eq("addon_key", "kurumsal_satis")
    .maybeSingle();
  if (paket?.status !== "active" && paket?.status !== "trial") redirect("/panel/sozlesmeler");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Yeni Sözleşme</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Müşteri, kapsam ve ziyaret periyodunu girerek bir bakım sözleşmesi oluşturun.
      </p>
      <div className="mt-6">
        <SozlesmeFormu tenantId={profil?.tenant_id ?? ""} />
      </div>
    </div>
  );
}
