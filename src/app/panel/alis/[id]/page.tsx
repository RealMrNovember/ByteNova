import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { odemeDurumEtiket, odemeDurumSinifi } from "@/lib/alis";
import { paraFormatla } from "@/lib/doviz";

export default async function AlisDetayPage({
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

  const { data: alis } = await supabase
    .from("purchases")
    .select("*, suppliers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!alis) notFound();

  const { data: kalemler } = await supabase
    .from("purchase_items")
    .select("id, quantity, unit_price, line_total, products(id, name, sku)")
    .eq("purchase_id", id);

  const tedarikci = alis.suppliers as unknown as { id: string; name: string; phone: string | null } | null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel/alis" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Alış
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-lg font-bold text-white">{alis.purchase_no}</h1>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${odemeDurumSinifi(alis.payment_status)}`}>
                {odemeDurumEtiket(alis.payment_status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Fatura tarihi: {new Date(`${alis.invoice_date}T12:00:00`).toLocaleDateString("tr-TR")}
              {alis.supplier_invoice_no && ` · Tedarikçi fatura no: ${alis.supplier_invoice_no}`}
            </p>
          </div>
          <p className="text-2xl font-bold text-white">
            {alis.currency === "TRY" ? paraFormatla(alis.total_amount) : `${alis.total_amount.toLocaleString("tr-TR")} ${alis.currency}`}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Tedarikçi</p>
            {tedarikci ? (
              <Link href={`/panel/tedarikciler/${tedarikci.id}`} className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50">
                🤝 {tedarikci.name}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">—</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Kur</p>
            <p className="mt-0.5 text-sm text-slate-200">
              {alis.currency === "TRY" ? "—" : `1 ${alis.currency} = ${Number(alis.exchange_rate).toLocaleString("tr-TR")} TL`}
            </p>
          </div>
        </div>

        {alis.notes && (
          <div className="mt-3 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Not</p>
            <p className="mt-0.5 text-sm text-slate-300">{alis.notes}</p>
          </div>
        )}
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Kalemler</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {(kalemler ?? []).map((k) => {
            const urun = k.products as unknown as { id: string; name: string; sku: string | null } | null;
            return (
              <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  {urun ? (
                    <Link href={`/panel/stok/${urun.id}`} className="truncate text-sm text-slate-200 hover:text-nova-300">
                      {urun.name}
                    </Link>
                  ) : (
                    <p className="truncate text-sm text-slate-200">Silinmiş ürün</p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {k.quantity} × {k.unit_price.toLocaleString("tr-TR")} {alis.currency}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-200">
                  {k.line_total.toLocaleString("tr-TR")} {alis.currency}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
