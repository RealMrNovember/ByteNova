import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { efektifMenu } from "@/lib/flags";

export const metadata: Metadata = { title: "Menü — ByteNova" };

export default async function MobilMenuPage() {
  const supabase = await createClient();
  const PANEL_MENU = await efektifMenu(supabase);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-white">Tüm Modüller</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        ByteNova&apos;nın tam yol haritası — ışıklar her gün birer birer yanıyor.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PANEL_MENU.map((m) => (
          <Link
            key={m.slug}
            href={m.slug ? `/panel/${m.slug}` : "/panel"}
            className="glass flex flex-col items-center gap-2 rounded-xl px-3 py-5 transition-transform active:scale-95"
          >
            <span className="text-2xl">{m.ikon}</span>
            <span className="text-sm font-medium text-slate-200">{m.ad}</span>
            {m.durum === "aktif" ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Aktif
              </span>
            ) : m.durum === "insa" ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                İnşada
              </span>
            ) : (
              <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Yakında
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
