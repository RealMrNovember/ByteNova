import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CihazFormu } from "@/components/cihaz/CihazFormu";

export const metadata: Metadata = { title: "Cihaz Düzenle — ByteNova" };

export default async function CihazDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: c } = await supabase
    .from("devices")
    .select("*, customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!c) notFound();

  const sahip = c.customers as unknown as {
    id: string;
    name: string;
    phone: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Cihaz Düzenle</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        {[c.brand, c.model].filter(Boolean).join(" ") || "İsimsiz cihaz"}
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <CihazFormu tenantId={c.tenant_id} mevcut={c} mevcutMusteri={sahip} />
      </div>
    </div>
  );
}
