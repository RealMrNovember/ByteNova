import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { paraFormatla } from "@/lib/doviz";
import { bilesenIkon, bilesenEtiket, planDurumu } from "@/lib/toplama";
import { PcPlaniDetay } from "@/components/toplama/PcPlaniDetay";

export const metadata: Metadata = { title: "PC Planı — ByteNova" };

export default async function PcPlaniDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: plan } = await supabase
    .from("assembly_plans")
    .select("*, customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!plan) notFound();

  const { data: kalemlerHam } = await supabase
    .from("assembly_plan_items")
    .select("id, component_type, name, brand, estimated_price, quantity, matched_product_id, products:matched_product_id(name)")
    .eq("plan_id", id)
    .order("sort_order");

  const kalemler = (kalemlerHam ?? []).map((k) => ({
    id: k.id,
    component_type: k.component_type,
    name: k.name,
    brand: k.brand,
    estimated_price: k.estimated_price,
    quantity: k.quantity,
    matched_product_id: k.matched_product_id,
    matched_product_name: (k.products as unknown as { name: string } | null)?.name ?? null,
  }));

  const musteri = plan.customers as unknown as { id: string; name: string; phone: string | null } | null;
  const parcaToplami = kalemler.reduce((t, k) => t + k.estimated_price * k.quantity, 0);
  const genelToplam = parcaToplami + plan.labor_cost;
  const durumBilgi = planDurumu(plan.status);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel/pc-toplama" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← PC Toplama
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-slate-500">{plan.plan_no}</p>
            <h1 className="text-lg font-bold text-white">🌐 {plan.name}</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${durumBilgi.sinif}`}>{durumBilgi.etiket}</span>
        </div>
        {musteri && <p className="mt-1 text-sm text-slate-400">👤 {musteri.name}</p>}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">{paraFormatla(parcaToplami)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Parça (Tahmini)</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">{paraFormatla(plan.labor_cost)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">İşçilik</p>
          </div>
          <div className="rounded-lg border border-nova-500/30 bg-nova-500/10 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-nova-300">{paraFormatla(genelToplam)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Genel Toplam</p>
          </div>
        </div>
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Kalemler</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {kalemler.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="text-slate-200">
                  {bilesenIkon(k.component_type)} {k.name} <span className="text-slate-500">× {k.quantity}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {bilesenEtiket(k.component_type)}
                  {k.brand && ` · ${k.brand}`}
                </p>
              </div>
              <span className="shrink-0 font-medium text-slate-200">{paraFormatla(k.estimated_price * k.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <PcPlaniDetay planId={plan.id} durum={plan.status} kalemler={kalemler} />

      {plan.status === "donusturuldu" && plan.converted_order_id && (
        <Link
          href={`/panel/pc-toplama/${plan.converted_order_id}`}
          className="glass mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm text-nova-300 transition hover:bg-slate-800/30"
        >
          <span>✓ Bu plan bir toplama emrine dönüştürüldü</span>
          <span>→</span>
        </Link>
      )}
    </div>
  );
}
