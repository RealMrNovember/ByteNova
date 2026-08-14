import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CihazFormu } from "@/components/cihaz/CihazFormu";

export const metadata: Metadata = { title: "Yeni Cihaz — ByteNova" };

export default async function YeniCihazPage({
  searchParams,
}: {
  searchParams: Promise<{ musteri?: string }>;
}) {
  const { musteri: musteriId } = await searchParams;
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

  // Müşteri detayından "cihaz ekle" ile gelindiyse ön-seçim
  let onMusteri = null;
  if (musteriId) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("id", musteriId)
      .maybeSingle();
    onMusteri = data;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Yeni Cihaz</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Cihazı kaydedin — servis ve satış geçmişi bu karta bağlanacak.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <CihazFormu
          tenantId={profil?.tenant_id ?? ""}
          onVarsayilanMusteri={onMusteri}
        />
      </div>
    </div>
  );
}
