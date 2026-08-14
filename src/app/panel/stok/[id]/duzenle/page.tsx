import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { urunFormuIcinDovizVerisi } from "@/lib/doviz";
import { UrunFormu } from "@/components/urun/UrunFormu";

export const metadata: Metadata = { title: "Ürün Düzenle — ByteNova" };

export default async function UrunDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: u } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!u) notFound();

  const { paraBirimleri, kurlar } = await urunFormuIcinDovizVerisi(supabase);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Ürün Düzenle</h1>
      <p className="mt-0.5 text-sm text-slate-400">{u.name}</p>
      <div className="glass mt-6 rounded-xl p-6">
        <UrunFormu
          tenantId={u.tenant_id}
          paraBirimleri={paraBirimleri}
          kurlar={kurlar}
          mevcut={u}
        />
      </div>
    </div>
  );
}
