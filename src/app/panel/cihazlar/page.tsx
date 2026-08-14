import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cihazIkon, cihazEtiket } from "@/lib/cihaz";

export const metadata: Metadata = { title: "Cihazlar — ByteNova" };

export default async function CihazlarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let sorgu = supabase
    .from("devices")
    .select("id, device_type, brand, model, serial_no, imei, customers(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q?.trim()) {
    const aranan = q.trim();
    sorgu = sorgu.or(
      `serial_no.ilike.%${aranan}%,imei.ilike.%${aranan}%,brand.ilike.%${aranan}%,model.ilike.%${aranan}%`
    );
  }

  const { data: cihazlar } = await sorgu;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Cihazlar</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {q ? `"${q}" için sonuçlar` : "Seri numarası bazlı cihaz envanteri"}
          </p>
        </div>
        <Link
          href="/panel/cihazlar/yeni"
          className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
        >
          + Yeni Cihaz
        </Link>
      </div>

      <form method="get" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Seri no, IMEI, marka veya model ile ara…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
      </form>

      {!cihazlar?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">💻</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz cihaz yok"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            {q
              ? "Farklı bir arama deneyin."
              : "Cihazları kaydedin — 8 ay sonra müşteri geldiğinde seri numarasıyla tüm geçmişi saniyede bulun."}
          </p>
          <Link
            href="/panel/cihazlar/yeni"
            className="mt-6 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + İlk cihazı kaydet
          </Link>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Cihaz</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Seri No / IMEI
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Sahibi
                </th>
                <th className="px-4 py-3 text-right font-medium">Tür</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cihazlar.map((c) => {
                const sahip = c.customers as unknown as { name: string } | null;
                return (
                  <tr
                    key={c.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/panel/cihazlar/${c.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <span className="text-base">
                          {cihazIkon(c.device_type)}
                        </span>
                        <span className="font-medium text-slate-200">
                          {[c.brand, c.model].filter(Boolean).join(" ") ||
                            "İsimsiz cihaz"}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2.5 font-mono text-xs text-slate-400 sm:table-cell">
                      {c.serial_no ?? c.imei ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-400 md:table-cell">
                      {sahip?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-500">
                      {cihazEtiket(c.device_type)}
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
