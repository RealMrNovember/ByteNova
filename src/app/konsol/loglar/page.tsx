import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sistem Logları — Konsol — ByteNova" };

type LogSatiri = {
  kaynak: "platform" | "tenant";
  kayit_id: string;
  created_at: string;
  tenant_id: string | null;
  tenant_name: string | null;
  aktor_email: string | null;
  aktor_ad: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detay: Record<string, unknown> | null;
};

const KAYNAK_ETIKET: Record<string, { ad: string; sinif: string }> = {
  platform: { ad: "ByteNova", sinif: "bg-purple-500/15 text-purple-300" },
  tenant: { ad: "İşletme", sinif: "bg-slate-500/15 text-slate-400" },
};

export default async function KonsolLoglarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_sistem_loglari", {
    p_limit: 200,
    p_tenant_id: null,
    p_arama: q?.trim() || null,
  });
  const loglar = (data as LogSatiri[]) ?? [];

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Sistem Logları</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        ByteNova destek işlemleri ve tüm işletmelerdeki denetim kayıtları — tek
        zaman çizelgesinde, en yeni 200 kayıt
      </p>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Aksiyon, e-posta veya işletme adıyla ara…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
        />
      </form>

      {error ? (
        <div className="glass mt-6 rounded-xl p-5 text-sm text-red-300">
          Loglar yüklenemedi.
        </div>
      ) : loglar.length === 0 ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">📜</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz log yok"}
          </h2>
        </div>
      ) : (
        <div className="glass mt-6 divide-y divide-slate-800/60 overflow-hidden rounded-xl">
          {loglar.map((l) => {
            const kaynak = KAYNAK_ETIKET[l.kaynak];
            return (
              <div key={`${l.kaynak}-${l.kayit_id}`} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${kaynak.sinif}`}>
                    {kaynak.ad}
                  </span>
                  <span className="text-sm font-medium text-slate-200">{l.action}</span>
                  {l.entity && (
                    <span className="font-mono text-[11px] text-slate-500">
                      {l.entity}
                      {l.entity_id ? `#${l.entity_id}` : ""}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-slate-500">
                    {new Date(l.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {l.tenant_id && l.tenant_name && (
                    <Link href={`/konsol/${l.tenant_id}`} className="hover:text-purple-300">
                      🏢 {l.tenant_name}
                    </Link>
                  )}
                  {(l.aktor_ad || l.aktor_email) && (
                    <span>👤 {l.aktor_ad ?? l.aktor_email}</span>
                  )}
                </div>
                {l.detay && Object.values(l.detay).some((v) => v != null) && (
                  <p className="mt-1 truncate font-mono text-[11px] text-slate-600" title={JSON.stringify(l.detay)}>
                    {JSON.stringify(l.detay)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
