import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cihazIkon } from "@/lib/cihaz";
import { durumEtiket, durumSinifi, oncelikBul } from "@/lib/servis";

export const metadata: Metadata = { title: "Servisler — ByteNova" };

export default async function ServislerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let sorgu = supabase
    .from("service_orders")
    .select(
      "id, service_no, status, priority, declared_issue, created_at, customers(name), devices(device_type, brand, model)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (q?.trim()) {
    sorgu = sorgu.ilike("service_no", `%${q.trim()}%`);
  }

  const { data: servisler } = await sorgu;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Servisler</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {q ? `"${q}" için sonuçlar` : "Kabulden teslime tüm servis kayıtları"}
          </p>
        </div>
        <Link
          href="/panel/servisler/yeni"
          className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
        >
          + Yeni Servis
        </Link>
      </div>

      <form method="get" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Servis numarası ile ara (BN-2026-...)…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
      </form>

      {!servisler?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">🔧</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz servis kaydı yok"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            {q
              ? "Farklı bir servis numarası deneyin."
              : "İlk servis kabulünüzü oluşturun — kabulden teslime tüm süreç burada izlenir."}
          </p>
          <Link
            href="/panel/servisler/yeni"
            className="mt-6 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + İlk servisi oluştur
          </Link>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Servis No</th>
                <th className="px-4 py-3 font-medium">Müşteri / Cihaz</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Öncelik
                </th>
                <th className="px-4 py-3 text-right font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {servisler.map((s) => {
                const musteri = s.customers as unknown as { name: string } | null;
                const cihaz = s.devices as unknown as {
                  device_type: string;
                  brand: string | null;
                  model: string | null;
                } | null;
                const oncelik = oncelikBul(s.priority);
                return (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/panel/servisler/${s.id}`}
                        className="font-mono text-xs font-medium text-nova-300"
                      >
                        {s.service_no}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/panel/servisler/${s.id}`}>
                        <span className="text-slate-200">
                          {musteri?.name ?? "—"}
                        </span>
                        {cihaz && (
                          <span className="ml-2 text-xs text-slate-500">
                            {cihazIkon(cihaz.device_type)}{" "}
                            {[cihaz.brand, cihaz.model]
                              .filter(Boolean)
                              .join(" ")}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${oncelik.sinif}`}
                      >
                        {oncelik.etiket}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durumSinifi(s.status)}`}
                      >
                        {durumEtiket(s.status)}
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
