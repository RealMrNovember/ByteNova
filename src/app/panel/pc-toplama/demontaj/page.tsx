import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DemontajFormu } from "@/components/toplama/DemontajFormu";

export const metadata: Metadata = { title: "Demontaj — ByteNova" };

export default async function DemontajPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: tamamlanmisEmirler } = await supabase
    .from("assembly_orders")
    .select("id, order_no, product_id")
    .eq("status", "tamamlandi")
    .order("completed_at", { ascending: false })
    .limit(50);

  const { data: gecmis } = await supabase
    .from("disassembly_orders")
    .select("id, source_type, created_at, disassembly_order_items(id, product_id, quantity)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/panel/pc-toplama" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← PC Toplama
      </Link>
      <h1 className="mt-2 text-xl font-bold text-white">🔩 Demontaj</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Satılmayan bir toplama PC&apos;yi parçalarına ayırın veya hurdaya ayrılan bir cihazdan
        sağlam parça hasat edin — her iki durumda da parçalar stoğa geri döner.
      </p>

      <div className="glass mt-6 rounded-xl p-6">
        <DemontajFormu tamamlanmisEmirler={(tamamlanmisEmirler ?? []).filter((e) => e.product_id)} />
      </div>

      {!!gecmis?.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Geçmiş</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {gecmis.map((g) => {
              const kalemSayisi = (g.disassembly_order_items as unknown as { id: string }[])?.length ?? 0;
              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-sm text-slate-300">
                    {g.source_type === "assembly_order" ? "Toplama PC demontajı" : "Serbest parça hasadı"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {kalemSayisi} kalem · {new Date(g.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
