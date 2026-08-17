import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { paraFormatla } from "@/lib/doviz";
import { DURUM_ETIKETLERI, DURUM_SINIFLARI, type ToplamaDurum } from "@/lib/toplama";

export const metadata: Metadata = { title: "PC Toplama — ByteNova" };

export default async function PcToplamaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const [{ data: emirler }, { data: receteler }] = await Promise.all([
    supabase
      .from("assembly_orders")
      .select("id, order_no, status, parts_cost, labor_cost, created_at, customers(name)")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("assembly_recipes")
      .select("id, name, labor_cost, assembly_recipe_items(id)")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">PC Toplama</h1>
          <p className="mt-0.5 text-sm text-slate-400">Reçeteler ve toplama emirleri</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/panel/pc-toplama/demontaj"
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            🔩 Demontaj
          </Link>
          <Link
            href="/panel/pc-toplama/receteler/yeni"
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            + Reçete
          </Link>
          <Link
            href="/panel/pc-toplama/yeni"
            className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + Yeni Toplama Emri
          </Link>
        </div>
      </div>

      {!!receteler?.length && (
        <div className="glass mt-5 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Reçeteler</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {receteler.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-slate-200">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {(r.assembly_recipe_items as unknown as { id: string }[])?.length ?? 0} parça · İşçilik{" "}
                  {paraFormatla(r.labor_cost)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Toplama Emirleri</h2>
        </div>
        {!emirler?.length ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="text-4xl">🖥️</span>
            <h2 className="mt-4 font-semibold text-white">Henüz toplama emri yok</h2>
            <p className="mt-1.5 max-w-sm text-sm text-slate-400">
              Bir reçete seçerek veya müşteriye özel serbest bir parça listesiyle ilk toplama
              emrinizi oluşturun.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {emirler.map((e) => {
              const musteri = e.customers as unknown as { name: string } | null;
              return (
                <Link
                  key={e.id}
                  href={`/panel/pc-toplama/${e.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-800/30"
                >
                  <div>
                    <p className="font-mono text-sm text-slate-200">{e.order_no}</p>
                    <p className="text-[11px] text-slate-500">{musteri?.name ?? "Genel stok"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">
                      {paraFormatla((e.parts_cost ?? 0) + (e.labor_cost ?? 0))}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${DURUM_SINIFLARI[e.status as ToplamaDurum]}`}
                    >
                      {DURUM_ETIKETLERI[e.status as ToplamaDurum] ?? e.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
