import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { odemeDurumEtiket, odemeDurumSinifi } from "@/lib/alis";
import { paraFormatla } from "@/lib/doviz";

export const metadata: Metadata = { title: "Alış — ByteNova" };

export default async function AlisListesiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();
  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  const { data: alislar } = await supabase
    .from("purchases")
    .select("id, purchase_no, invoice_date, currency, total_amount, payment_status, suppliers(name)")
    .order("invoice_date", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Alış</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Tedarikçi faturaları — stok girişi ve maliyet güncellemesi otomatik
          </p>
        </div>
        {yetkili && (
          <Link
            href="/panel/alis/yeni"
            className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + Yeni Alış
          </Link>
        )}
      </div>

      {!alislar?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">🚚</span>
          <h2 className="mt-4 font-semibold text-white">Henüz alış kaydı yok</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            Tedarikçiden gelen ilk faturayı girin — ürünler stoğa işlenir,
            maliyetler ve otomatik fiyatlı ürünlerin satış fiyatı güncellenir.
          </p>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Alış No</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Tedarikçi</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Tarih</th>
                <th className="px-4 py-3 text-right font-medium">Tutar</th>
                <th className="px-4 py-3 text-right font-medium">Ödeme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alislar.map((a) => {
                const tedarikci = a.suppliers as unknown as { name: string } | null;
                return (
                  <tr key={a.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <Link href={`/panel/alis/${a.id}`} className="font-mono text-slate-200 hover:text-nova-300">
                        {a.purchase_no}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-400 sm:table-cell">
                      {tedarikci?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-xs text-slate-500 md:table-cell">
                      {new Date(`${a.invoice_date}T12:00:00`).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-200">
                      {a.currency === "TRY"
                        ? paraFormatla(a.total_amount)
                        : `${a.total_amount.toLocaleString("tr-TR")} ${a.currency}`}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${odemeDurumSinifi(a.payment_status)}`}
                      >
                        {odemeDurumEtiket(a.payment_status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
