import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cihazIkon } from "@/lib/cihaz";
import { durumEtiket, durumSinifi, oncelikBul } from "@/lib/servis";

type Aksesuar = { name: string; delivered: boolean };

export default async function ServisDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: s } = await supabase
    .from("service_orders")
    .select("*, customers(id, name, phone), devices(id, device_type, brand, model, serial_no)")
    .eq("id", id)
    .maybeSingle();

  if (!s) notFound();

  const musteri = s.customers as unknown as {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  const cihaz = s.devices as unknown as {
    id: string;
    device_type: string;
    brand: string | null;
    model: string | null;
    serial_no: string | null;
  } | null;

  const { data: gecmis } = await supabase
    .from("service_status_history")
    .select("from_status, to_status, note, created_at")
    .eq("service_order_id", id)
    .order("created_at", { ascending: false });

  const checklist = (s.physical_condition ?? {}) as Record<string, boolean>;
  const checklistMaddeleri = Object.entries(checklist);
  const aksesuarlar = (s.accessories ?? []) as Aksesuar[];
  const oncelik = oncelikBul(s.priority);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/panel/servisler"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Servisler
      </Link>

      {/* Başlık kartı */}
      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-lg font-bold text-white">
                {s.service_no}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durumSinifi(s.status)}`}
              >
                {durumEtiket(s.status)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${oncelik.sinif}`}
              >
                {oncelik.etiket}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Kabul: {new Date(s.created_at).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Müşteri
            </p>
            {musteri ? (
              <Link
                href={`/panel/musteriler/${musteri.id}`}
                className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50"
              >
                👤 {musteri.name}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">—</p>
            )}
            {musteri?.phone && (
              <p className="mt-0.5 text-xs text-slate-500">{musteri.phone}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Cihaz
            </p>
            {cihaz ? (
              <Link
                href={`/panel/cihazlar/${cihaz.id}`}
                className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50"
              >
                {cihazIkon(cihaz.device_type)}{" "}
                {[cihaz.brand, cihaz.model].filter(Boolean).join(" ") ||
                  "İsimsiz cihaz"}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">—</p>
            )}
            {cihaz?.serial_no && (
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {cihaz.serial_no}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Müşteri Beyanı
          </p>
          <p className="mt-1 text-sm text-slate-200">{s.declared_issue}</p>
        </div>

        {aksesuarlar.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Aksesuarlar
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {aksesuarlar.map((a) => (
                <span
                  key={a.name}
                  className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300"
                >
                  {a.delivered ? "✓" : "•"} {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {checklistMaddeleri.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Fiziksel Kabul Kontrolü
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {checklistMaddeleri.map(([madde, tamam]) => (
                <span
                  key={madde}
                  className={`text-xs ${tamam ? "text-slate-400" : "text-amber-300"}`}
                >
                  {tamam ? "✓" : "⚠"} {madde}
                </span>
              ))}
            </div>
          </div>
        )}

        {s.consent_accepted && (
          <p className="mt-4 text-[11px] text-slate-600">
            ✓ Servis kabul koşulları müşteri huzurunda onaylandı —{" "}
            {new Date(s.consent_accepted_at).toLocaleString("tr-TR")}
          </p>
        )}
      </div>

      {/* Durum geçmişi */}
      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Durum Geçmişi</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Durum değişim akışı ve teknisyen atama Gün 9&apos;da bu ekrana
          eklenecek.
        </p>
        <div className="mt-4 space-y-0">
          {(gecmis ?? []).map((g, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-nova-400 bg-surface" />
                {i < (gecmis?.length ?? 0) - 1 && (
                  <span className="w-px flex-1 bg-slate-800" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm text-slate-200">
                  {durumEtiket(g.to_status)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  {new Date(g.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
