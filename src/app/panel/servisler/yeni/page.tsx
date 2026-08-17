import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { YeniServisFormu } from "@/components/servis/YeniServisFormu";

export const metadata: Metadata = { title: "Yeni Servis — ByteNova" };

export default async function YeniServisPage({
  searchParams,
}: {
  searchParams: Promise<{ kaynak?: string }>;
}) {
  const { kaynak } = await searchParams;
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

  let kaynakServis: {
    id: string;
    service_no: string;
    musteri: { id: string; name: string; phone: string | null } | null;
    cihaz: { id: string; device_type: string; brand: string | null; model: string | null; serial_no: string | null } | null;
  } | null = null;

  if (kaynak) {
    const { data } = await supabase
      .from("service_orders")
      .select("id, service_no, customers(id, name, phone), devices(id, device_type, brand, model, serial_no)")
      .eq("id", kaynak)
      .single();
    if (data) {
      kaynakServis = {
        id: data.id,
        service_no: data.service_no,
        musteri: data.customers as unknown as { id: string; name: string; phone: string | null } | null,
        cihaz: data.devices as unknown as
          | { id: string; device_type: string; brand: string | null; model: string | null; serial_no: string | null }
          | null,
      };
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Yeni Servis Kabul</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Müşteri, cihaz ve arıza bilgilerini girerek servis kaydı oluşturun.
      </p>
      {kaynakServis && (
        <p className="mt-3 rounded-lg border border-nova-500/30 bg-nova-500/10 px-3.5 py-2.5 text-xs text-nova-300">
          🛡️ Garanti kapsamında tekrar servis — kaynak: <span className="font-mono">{kaynakServis.service_no}</span>
        </p>
      )}
      <div className="glass mt-6 rounded-xl p-6">
        <YeniServisFormu
          tenantId={profil?.tenant_id ?? ""}
          kaynakServisId={kaynakServis?.id ?? null}
          ilkMusteri={kaynakServis?.musteri ?? null}
          ilkCihaz={kaynakServis?.cihaz ?? null}
        />
      </div>
    </div>
  );
}
