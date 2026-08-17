import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { paraFormatla } from "@/lib/doviz";
import { DURUM_ETIKETLERI, DURUM_SINIFLARI, type ToplamaDurum } from "@/lib/toplama";
import { ToplamaIslemleri } from "@/components/toplama/ToplamaIslemleri";

export default async function ToplamaEmriDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: emir } = await supabase
    .from("assembly_orders")
    .select("*, customers(name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!emir) notFound();

  const { data: kalemler } = await supabase
    .from("assembly_order_items")
    .select("id, product_name, quantity, serial_no, unit_cost_try")
    .eq("assembly_order_id", id)
    .order("created_at");

  const musteri = emir.customers as unknown as { name: string; phone: string | null } | null;
  const toplamMaliyet = (emir.parts_cost ?? 0) + (emir.labor_cost ?? 0);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/panel/pc-toplama" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← PC Toplama
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-lg font-bold text-white">{emir.order_no}</h1>
            <p className="mt-0.5 text-xs text-slate-500">{musteri?.name ?? "Genel stok (müşteri belirtilmedi)"}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${DURUM_SINIFLARI[emir.status as ToplamaDurum]}`}
          >
            {DURUM_ETIKETLERI[emir.status as ToplamaDurum] ?? emir.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-sm font-semibold text-slate-200">{paraFormatla(emir.parts_cost ?? 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Parça Maliyeti</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-sm font-semibold text-slate-200">{paraFormatla(emir.labor_cost ?? 0)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">İşçilik</p>
          </div>
          <div className="rounded-lg border border-nova-500/30 bg-nova-500/10 px-3 py-2.5 text-center">
            <p className="text-sm font-semibold text-nova-300">{paraFormatla(toplamMaliyet)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Toplam</p>
          </div>
        </div>

        {emir.notes && (
          <p className="mt-3 rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5 text-sm text-slate-300">
            {emir.notes}
          </p>
        )}
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Parçalar</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {(kalemler ?? []).map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm text-slate-200">
                  {k.product_name} <span className="text-slate-500">× {k.quantity}</span>
                </p>
                {k.serial_no && <p className="font-mono text-[11px] text-slate-500">SN: {k.serial_no}</p>}
              </div>
              <span className="text-sm text-slate-400">
                {k.unit_cost_try != null ? paraFormatla(k.unit_cost_try * k.quantity) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {emir.product_id && (
        <Link
          href={`/panel/stok/${emir.product_id}`}
          className="glass mt-4 flex items-center justify-between rounded-xl p-4 text-sm text-emerald-300 transition hover:border-emerald-500/40"
        >
          <span>✓ Ürün stoğa eklendi — görüntülemek için tıklayın</span>
          <span>→</span>
        </Link>
      )}

      <ToplamaIslemleri
        orderId={emir.id}
        status={emir.status as ToplamaDurum}
        checklist={emir.checklist ?? []}
        toplamMaliyet={toplamMaliyet}
      />
    </div>
  );
}
