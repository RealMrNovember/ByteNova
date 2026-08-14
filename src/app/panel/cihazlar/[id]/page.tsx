import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cihazIkon, cihazEtiket } from "@/lib/cihaz";

const OLAY_IKONLARI: Record<string, string> = {
  created: "✨",
  ownership: "👤",
  service: "🔧",
  sale: "🧾",
  purchase: "🚚",
  warranty: "🛡️",
  note: "📝",
  system: "⚙️",
};

export default async function CihazDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: c } = await supabase
    .from("devices")
    .select("*, customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!c) notFound();

  const sahip = c.customers as unknown as {
    id: string;
    name: string;
    phone: string | null;
  } | null;

  const { data: olaylar } = await supabase
    .from("device_events")
    .select("id, kind, content, created_at")
    .eq("device_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/panel/cihazlar"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Cihazlar
      </Link>

      {/* Cihaz kartı */}
      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nova-500/15 text-xl">
              {cihazIkon(c.device_type)}
            </span>
            <div>
              <h1 className="text-lg font-bold text-white">
                {[c.brand, c.model].filter(Boolean).join(" ") ||
                  "İsimsiz cihaz"}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {cihazEtiket(c.device_type)} • Kayıt:{" "}
                {new Date(c.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
          <Link
            href={`/panel/cihazlar/${c.id}/duzenle`}
            className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            Düzenle
          </Link>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              Seri Numarası
            </dt>
            <dd className="mt-0.5 font-mono text-slate-200">
              {c.serial_no ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              {c.imei ? "IMEI" : "MAC Adresi"}
            </dt>
            <dd className="mt-0.5 font-mono text-slate-200">
              {c.imei ?? c.mac_address ?? "—"}
            </dd>
          </div>
        </dl>

        {/* Sahip */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Sahibi
            </p>
            {sahip ? (
              <Link
                href={`/panel/musteriler/${sahip.id}`}
                className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50"
              >
                👤 {sahip.name}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">
                Müşteri bağlantısı yok
              </p>
            )}
          </div>
          {sahip?.phone && (
            <span className="text-xs text-slate-500">{sahip.phone}</span>
          )}
        </div>

        {c.notes && (
          <p className="mt-4 rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5 text-sm text-slate-300">
            📝 {c.notes}
          </p>
        )}
      </div>

      {/* Zaman çizelgesi */}
      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Cihaz Geçmişi</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Alış → Satış → Servis → Garanti olayları ilgili modüller aktifleştikçe
          buraya otomatik işlenecek.
        </p>

        {!olaylar?.length ? (
          <p className="mt-5 text-center text-xs text-slate-600">
            Henüz olay yok.
          </p>
        ) : (
          <div className="mt-4 space-y-0">
            {olaylar.map((o, i) => (
              <div key={o.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-surface text-xs">
                    {OLAY_IKONLARI[o.kind] ?? "•"}
                  </span>
                  {i < olaylar.length - 1 && (
                    <span className="w-px flex-1 bg-slate-800" />
                  )}
                </div>
                <div className="pb-5">
                  <p className="text-sm text-slate-200">{o.content}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    {new Date(o.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
