import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etkinKurlar, paraFormatla } from "@/lib/doviz";

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: u } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .eq("id", id)
    .maybeSingle();

  if (!u) notFound();

  const kategori = u.product_categories as unknown as { name: string } | null;
  const kritikMi = u.stock_quantity <= u.critical_stock;

  // Dövizli alışsa kâr marjı, güncel kurla TL'ye çevrilmiş maliyet üzerinden hesaplanır
  let alisTLKarsiligi: number | null = u.purchase_price;
  if (u.purchase_price && u.purchase_currency !== "TRY") {
    const kurlar = await etkinKurlar(supabase);
    const guncelKur = kurlar.get(u.purchase_currency)?.rate_to_try ?? null;
    alisTLKarsiligi = guncelKur ? u.purchase_price * guncelKur : null;
  }

  const marj =
    alisTLKarsiligi != null && u.sale_price
      ? (((u.sale_price - alisTLKarsiligi) / u.sale_price) * 100).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/panel/stok"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Stok
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold text-white">{u.name}</h1>
              {kritikMi && (
                <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-semibold text-red-300">
                  ⚠️ Kritik Stok
                </span>
              )}
              {u.requires_serial && (
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                  Seri No Zorunlu
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {kategori?.name ?? "Kategorisiz"}
              {u.brand ? ` • ${u.brand}` : ""}
              {u.sku ? ` • SKU: ${u.sku}` : ""}
            </p>
          </div>
          <Link
            href={`/panel/stok/${u.id}/duzenle`}
            className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            Düzenle
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p
              className={`text-lg font-bold ${kritikMi ? "text-red-300" : "text-nova-300"}`}
            >
              {u.stock_quantity}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Stokta ({u.unit})
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">
              {u.sale_price != null ? `${u.sale_price.toLocaleString("tr-TR")}` : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Satış (TL)
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">
              {u.purchase_price != null
                ? u.purchase_currency !== "TRY"
                  ? `${u.purchase_price.toLocaleString("tr-TR")} ${u.purchase_currency}`
                  : u.purchase_price.toLocaleString("tr-TR")
                : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Alış{alisTLKarsiligi != null && u.purchase_currency !== "TRY"
                ? ` (${paraFormatla(alisTLKarsiligi)})`
                : " (TL)"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-emerald-300">
              {marj ? `%${marj}` : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Kâr Marjı
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              Barkod
            </dt>
            <dd className="mt-0.5 font-mono text-sm text-slate-200">
              {u.barcode ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              KDV / Garanti
            </dt>
            <dd className="mt-0.5 text-sm text-slate-200">
              %{u.vat_rate}
              {u.warranty_months ? ` • ${u.warranty_months} ay garanti` : ""}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              Min. Stok
            </dt>
            <dd className="mt-0.5 text-sm text-slate-200">{u.min_stock}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              Kritik Stok
            </dt>
            <dd className="mt-0.5 text-sm text-slate-200">{u.critical_stock}</dd>
          </div>
        </dl>
      </div>

      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Stok Hareketleri</h2>
        <p className="mt-2 text-center text-xs text-slate-600">
          Alış, satış, servis kullanımı ve sayım hareketleri Gün 13&apos;te bu
          ekrana eklenecek.
        </p>
      </div>
    </div>
  );
}
