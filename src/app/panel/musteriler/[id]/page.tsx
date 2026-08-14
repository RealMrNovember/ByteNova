import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IletisimGecmisi } from "@/components/musteri/IletisimGecmisi";
import { cihazIkon } from "@/lib/cihaz";

export default async function MusteriDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: m } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!m) notFound();

  const { data: olaylar } = await supabase
    .from("customer_events")
    .select("id, kind, content, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: cihazlar } = await supabase
    .from("devices")
    .select("id, device_type, brand, model, serial_no")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // 360° özet — servis/satış modülleri geldikçe gerçek sayılara bağlanacak
  const ozet = [
    { etiket: "Satış", deger: "—" },
    { etiket: "Servis", deger: "—" },
    { etiket: "Cihaz", deger: String(cihazlar?.length ?? 0) },
    { etiket: "Bakiye", deger: "—" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/panel/musteriler"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Müşteriler
      </Link>

      {/* Başlık kartı */}
      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nova-500/15 text-xl">
              {m.type === "corporate" ? "🏢" : "👤"}
            </span>
            <div>
              <h1 className="text-lg font-bold text-white">{m.name}</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {m.type === "corporate" ? "Kurumsal" : "Bireysel"} • Kayıt:{" "}
                {new Date(m.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {m.phone && (
              <a
                href={`https://wa.me/9${m.phone.replace(/\D/g, "").replace(/^0/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-emerald-600/40 px-3.5 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
              >
                🟢 WhatsApp
              </a>
            )}
            <Link
              href={`/panel/musteriler/${m.id}/duzenle`}
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
            >
              Düzenle
            </Link>
          </div>
        </div>

        {/* 360° özet şeridi */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {ozet.map((o) => (
            <div
              key={o.etiket}
              className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center"
            >
              <p
                className={`text-lg font-bold ${
                  o.deger === "—" ? "text-slate-600" : "text-nova-300"
                }`}
              >
                {o.deger}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                {o.etiket}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cihazlar */}
      <div className="glass mt-4 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Cihazları</h2>
          <Link
            href={`/panel/cihazlar/yeni?musteri=${m.id}`}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            + Cihaz Ekle
          </Link>
        </div>
        {!cihazlar?.length ? (
          <p className="mt-4 text-center text-xs text-slate-600">
            Bu müşteriye bağlı cihaz yok.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-800/60">
            {cihazlar.map((c) => (
              <Link
                key={c.id}
                href={`/panel/cihazlar/${c.id}`}
                className="flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-800/20"
              >
                <span className="text-base">{cihazIkon(c.device_type)}</span>
                <span className="flex-1 text-sm text-slate-200">
                  {[c.brand, c.model].filter(Boolean).join(" ") ||
                    "İsimsiz cihaz"}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {c.serial_no ?? "—"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bilgiler */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">
            İletişim Bilgileri
          </h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Telefon</dt>
              <dd className="text-slate-200">{m.phone ?? "—"}</dd>
            </div>
            {m.phone2 && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Telefon 2</dt>
                <dd className="text-slate-200">{m.phone2}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">E-posta</dt>
              <dd className="text-slate-200">{m.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Adres</dt>
              <dd className="text-right text-slate-200">{m.address ?? "—"}</dd>
            </div>
            {m.type === "corporate" && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Vergi dairesi</dt>
                  <dd className="text-slate-200">{m.tax_office ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Vergi no</dt>
                  <dd className="text-slate-200">{m.tax_number ?? "—"}</dd>
                </div>
              </>
            )}
            {m.notes && (
              <div className="border-t border-slate-800 pt-2.5">
                <dt className="text-slate-500">Notlar</dt>
                <dd className="mt-1 text-slate-300">{m.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <IletisimGecmisi
          musteriId={m.id}
          tenantId={m.tenant_id}
          olaylar={olaylar ?? []}
        />
      </div>
    </div>
  );
}
