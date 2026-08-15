import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etkinKurlar, kdvHaricFiyat, paraFormatla } from "@/lib/doviz";
import { hareketEtiket, hareketIkon } from "@/lib/stok";
import { yetkiVar } from "@/lib/yetki";
import { StokDuzeltme } from "@/components/urun/StokDuzeltme";

export default async function UrunDetayPage({
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

  const { data: u } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .eq("id", id)
    .maybeSingle();

  if (!u) notFound();

  const { data: hareketler } = await supabase
    .from("stock_movements")
    .select("id, movement_type, quantity_change, quantity_before, quantity_after, reason, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  const yetkili = yetkiVar(profil?.role, "stok_yonet");

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
          <div className="flex shrink-0 gap-2">
            <StokDuzeltme
              productId={u.id}
              mevcutStok={u.stock_quantity}
              yetkili={yetkili}
            />
            <Link
              href={`/panel/stok/${u.id}/duzenle`}
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
            >
              Düzenle
            </Link>
          </div>
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
              Perakende (KDV Dahil)
            </p>
            {u.sale_price != null && (
              <p className="mt-0.5 text-[10px] text-slate-600">
                Toptan: {paraFormatla(kdvHaricFiyat(u.sale_price, u.vat_rate))}
              </p>
            )}
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
        {!hareketler?.length ? (
          <p className="mt-4 text-center text-xs text-slate-600">
            Henüz stok hareketi yok.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-800/60">
            {hareketler.map((h) => (
              <div key={h.id} className="flex items-center gap-3 py-2.5">
                <span className="text-base">{hareketIkon(h.movement_type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">
                    {hareketEtiket(h.movement_type)}
                    {h.reason && (
                      <span className="text-slate-500"> — {h.reason}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {h.quantity_before} → {h.quantity_after} ·{" "}
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
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    h.quantity_change > 0
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {h.quantity_change > 0 ? "+" : ""}
                  {h.quantity_change}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
