import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { teklifDurumu } from "@/lib/teklif";
import { paraFormatla } from "@/lib/doviz";
import { yetkiVar } from "@/lib/yetki";

export const metadata: Metadata = { title: "Teklifler — ByteNova" };

export default async function TekliflerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; durum?: string }>;
}) {
  const { q, durum } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!yetkiVar(profil?.role, "teklif_yonet")) redirect("/panel");

  let sorgu = supabase
    .from("quotes")
    .select("id, quote_no, status, currency, total_amount, valid_until, created_at, customers(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (durum) sorgu = sorgu.eq("status", durum);
  if (q?.trim()) sorgu = sorgu.ilike("quote_no", `%${q.trim()}%`);

  const { data: teklifler } = await sorgu;
  const filtreliMi = !!(q || durum);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Teklifler</h1>
          <p className="mt-0.5 text-sm text-slate-400">Kurumsal müşterilere fiyat teklifi hazırlayın</p>
        </div>
        <Link
          href="/panel/teklifler/yeni"
          className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
        >
          + Yeni Teklif
        </Link>
      </div>

      <form method="get" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Teklif numarası ile ara (TK-2026-...)…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
      </form>

      {!teklifler?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">📄</span>
          <h2 className="mt-4 font-semibold text-white">
            {filtreliMi ? "Sonuç bulunamadı" : "Henüz teklif yok"}
          </h2>
          <Link
            href="/panel/teklifler/yeni"
            className="mt-6 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + İlk teklifi oluştur
          </Link>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Teklif No</th>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Geçerlilik</th>
                <th className="px-4 py-3 text-right font-medium">Tutar</th>
                <th className="px-4 py-3 text-right font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teklifler.map((t) => {
                const musteri = t.customers as unknown as { name: string } | null;
                const durumBilgi = teklifDurumu(t.status);
                return (
                  <tr key={t.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <Link href={`/panel/teklifler/${t.id}`} className="font-mono text-xs font-medium text-nova-300">
                        {t.quote_no}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-200">{musteri?.name ?? "—"}</td>
                    <td className="hidden px-4 py-2.5 text-xs text-slate-500 sm:table-cell">
                      {new Date(t.valid_until).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                      {t.currency === "TRY" ? paraFormatla(t.total_amount) : `${t.currency} ${t.total_amount.toLocaleString("tr-TR")}`}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durumBilgi.sinif}`}>
                        {durumBilgi.etiket}
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
