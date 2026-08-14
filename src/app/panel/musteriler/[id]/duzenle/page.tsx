import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MusteriFormu } from "@/components/musteri/MusteriFormu";

export const metadata: Metadata = { title: "Müşteri Düzenle — ByteNova" };

export default async function MusteriDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: m } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!m) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Müşteri Düzenle</h1>
      <p className="mt-0.5 text-sm text-slate-400">{m.name}</p>
      <div className="glass mt-6 rounded-xl p-6">
        <MusteriFormu tenantId={m.tenant_id} mevcut={m} />
      </div>
    </div>
  );
}
