import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { etkinKurlar } from "@/lib/doviz";
import { TeklifFormu } from "@/components/teklif/TeklifFormu";

export const metadata: Metadata = { title: "Yeni Teklif — ByteNova" };

export default async function YeniTeklifPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("tenant_id, role").eq("id", user.id).single();
  if (!yetkiVar(profil?.role, "teklif_yonet")) redirect("/panel/teklifler");

  const kurHaritasi = await etkinKurlar(supabase);
  const kurlar: Record<string, number> = {};
  for (const [kod, veri] of kurHaritasi) kurlar[kod] = veri.rate_to_try;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Yeni Teklif</h1>
      <p className="mt-0.5 text-sm text-slate-400">Müşteri ve kalemleri girerek fiyat teklifi hazırlayın.</p>
      <div className="mt-6">
        <TeklifFormu tenantId={profil?.tenant_id ?? ""} kurlar={kurlar} />
      </div>
    </div>
  );
}
