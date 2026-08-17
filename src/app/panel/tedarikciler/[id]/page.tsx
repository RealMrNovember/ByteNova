import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { odemeDurumEtiket, odemeDurumSinifi } from "@/lib/alis";
import { paraFormatla, etkinKurlar } from "@/lib/doviz";
import { TedarikciOdeme } from "@/components/alis/TedarikciOdeme";
import { GiderPusulasiOlustur } from "@/components/alis/GiderPusulasiOlustur";

export default async function TedarikciDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: tedarikci } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tedarikci) notFound();

  const { data: alislar } = await supabase
    .from("purchases")
    .select("id, purchase_no, invoice_date, currency, total_amount, payment_status")
    .eq("supplier_id", id)
    .order("invoice_date", { ascending: false })
    .limit(30);

  const { data: cariHareketler } = await supabase
    .from("supplier_ledger")
    .select("id, entry_type, amount, amount_try, description, created_at")
    .eq("supplier_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: kasaHesaplari } = await supabase
    .from("cash_accounts")
    .select("id, name, type")
    .eq("is_active", true)
    .order("created_at");

  const { data: giderPusulalari } = tedarikci.is_taxpayer
    ? { data: null }
    : await supabase
        .from("e_document_records")
        .select("id, document_no, description, amount, net_amount, created_at")
        .eq("supplier_id", id)
        .eq("document_type", "gider_pusulasi")
        .order("created_at", { ascending: false });

  const yetkili = yetkiVar(profil?.role, "stok_yonet");
  const kasaYetkili = yetkiVar(profil?.role, "kasa_yonet");
  const toplamAlis = (alislar ?? []).length;

  let guncelKur: number | null = null;
  if (tedarikci.currency !== "TRY") {
    const kurlar = await etkinKurlar(supabase);
    guncelKur = kurlar.get(tedarikci.currency)?.rate_to_try ?? null;
  }

  const ENTRY_ETIKET: Record<string, string> = {
    alis_borc: "Alış borcu",
    odeme: "Ödeme",
    kur_farki: "Kur farkı",
    duzeltme: "Düzeltme",
    acilis_bakiyesi: "Açılış bakiyesi (devir)",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/panel/tedarikciler"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Tedarikçiler
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white">🤝 {tedarikci.name}</h1>
              {!tedarikci.is_taxpayer && (
                <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                  Vergi mükellefi değil
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {tedarikci.phone || "Telefon eklenmedi"} · {tedarikci.currency}
            </p>
          </div>
          {yetkili && (
            <Link
              href={`/panel/tedarikciler/${tedarikci.id}/duzenle`}
              className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
            >
              Düzenle
            </Link>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">IBAN</p>
            <p className="mt-0.5 font-mono text-sm text-slate-200">
              {tedarikci.iban ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Adres</p>
            <p className="mt-0.5 text-sm text-slate-200">{tedarikci.address ?? "—"}</p>
          </div>
        </div>

        {tedarikci.notes && (
          <div className="mt-3 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Notlar</p>
            <p className="mt-0.5 text-sm text-slate-300">{tedarikci.notes}</p>
          </div>
        )}
      </div>

      {!tedarikci.is_taxpayer && yetkili && (
        <div className="mt-4">
          <GiderPusulasiOlustur supplierId={tedarikci.id} />
        </div>
      )}

      {!!giderPusulalari?.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Gider Pusulaları</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {giderPusulalari.map((g) => (
              <a
                key={g.id}
                href={`/api/gider-pusulasi/${g.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-800/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{g.description ?? g.document_no}</p>
                  <p className="font-mono text-[11px] text-slate-500">{g.document_no}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-200">
                  {paraFormatla(g.net_amount ?? g.amount)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <TedarikciOdeme
          supplierId={tedarikci.id}
          bakiye={tedarikci.balance}
          paraBirimi={tedarikci.currency}
          guncelKur={guncelKur}
          yetkili={kasaYetkili}
          hareketYok={!cariHareketler?.length}
          kasaHesaplari={kasaHesaplari ?? []}
        />
      </div>

      {!!cariHareketler?.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Cari Hareketler</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {cariHareketler.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">
                    {ENTRY_ETIKET[h.entry_type] ?? h.entry_type}
                    {h.description && <span className="text-slate-500"> — {h.description}</span>}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {new Date(h.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    h.entry_type === "kur_farki"
                      ? h.amount_try > 0
                        ? "text-red-300"
                        : "text-emerald-300"
                      : (h.amount ?? 0) > 0
                        ? "text-amber-300"
                        : "text-emerald-300"
                  }`}
                >
                  {h.amount != null
                    ? `${h.amount > 0 ? "+" : ""}${h.amount.toLocaleString("tr-TR")} ${tedarikci.currency}`
                    : `${h.amount_try > 0 ? "+" : ""}${h.amount_try.toLocaleString("tr-TR")} TL`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">
            Alış Geçmişi {toplamAlis > 0 && `(${toplamAlis})`}
          </h2>
          {yetkili && (
            <Link
              href={`/panel/alis/yeni?tedarikci=${tedarikci.id}`}
              className="text-xs font-medium text-nova-300 hover:text-nova-100"
            >
              + Yeni Alış
            </Link>
          )}
        </div>
        {!alislar?.length ? (
          <p className="px-4 py-10 text-center text-sm text-slate-600">
            Bu tedarikçiden henüz alış yapılmadı.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {alislar.map((a) => (
              <Link
                key={a.id}
                href={`/panel/alis/${a.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-800/30"
              >
                <div>
                  <p className="font-mono text-sm text-slate-200">{a.purchase_no}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(`${a.invoice_date}T12:00:00`).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">
                    {a.currency === "TRY"
                      ? paraFormatla(a.total_amount)
                      : `${a.total_amount.toLocaleString("tr-TR")} ${a.currency}`}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${odemeDurumSinifi(a.payment_status)}`}
                  >
                    {odemeDurumEtiket(a.payment_status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
