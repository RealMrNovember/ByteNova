import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { kdvHaricFiyat, paraFormatla } from "@/lib/doviz";

export const metadata: Metadata = { title: "Stok — ByteNova" };

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kritik?: string; gorunum?: string }>;
}) {
  const { q, kritik, gorunum } = await searchParams;
  const toptanGorunum = gorunum === "toptan";
  const supabase = await createClient();

  let sorgu = supabase
    .from("products")
    .select(
      "id, name, sku, barcode, brand, sale_price, vat_rate, stock_quantity, critical_stock, product_categories(name)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (q?.trim()) {
    const aranan = q.trim();
    sorgu = sorgu.or(
      `name.ilike.%${aranan}%,sku.ilike.%${aranan}%,barcode.ilike.%${aranan}%`
    );
  }

  const { data: urunlerHam } = await sorgu;
  const urunler = kritik
    ? (urunlerHam ?? []).filter((u) => u.stock_quantity <= u.critical_stock)
    : urunlerHam;

  const filtreliMi = !!(q || kritik);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Stok</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Ürün kartları ve stok durumu
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/panel/stok/fiyat-guncelle"
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            💱 Kur Güncellemesi
          </Link>
          <Link
            href="/panel/stok/yeni"
            className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + Yeni Ürün
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form method="get" className="flex-1">
          {toptanGorunum && <input type="hidden" name="gorunum" value="toptan" />}
          {kritik && <input type="hidden" name="kritik" value="1" />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="🔍 Ürün adı, SKU veya barkod ile ara…"
            className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
          />
        </form>
        <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs font-medium">
          <Link
            href={{ pathname: "/panel/stok", query: { q, kritik } }}
            className={`px-3 py-2 transition-colors ${
              !toptanGorunum
                ? "bg-nova-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Perakende
          </Link>
          <Link
            href={{ pathname: "/panel/stok", query: { q, kritik, gorunum: "toptan" } }}
            className={`px-3 py-2 transition-colors ${
              toptanGorunum
                ? "bg-nova-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Toptan
          </Link>
        </div>
        <Link
          href={{
            pathname: "/panel/stok",
            query: { q, gorunum, kritik: kritik ? undefined : "1" },
          }}
          className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium transition-colors ${
            kritik
              ? "border-red-500/50 bg-red-500/10 text-red-300"
              : "border-slate-700 text-slate-400 hover:border-slate-500"
          }`}
        >
          ⚠️ Kritik Stoktakiler
        </Link>
      </div>

      {!urunler?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">📦</span>
          <h2 className="mt-4 font-semibold text-white">
            {filtreliMi ? "Sonuç bulunamadı" : "Henüz ürün yok"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            {filtreliMi
              ? "Farklı bir arama veya filtre deneyin."
              : "İlk ürününüzü ekleyin — alış, satış ve servis kayıtları buna bağlanacak."}
          </p>
          {!filtreliMi && (
            <Link
              href="/panel/stok/yeni"
              className="mt-6 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
            >
              + İlk ürünü ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Ürün</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Kategori
                </th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  {toptanGorunum ? "Toptan Fiyat (KDV Hariç)" : "Satış Fiyatı (KDV Dahil)"}
                </th>
                <th className="px-4 py-3 text-right font-medium">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {urunler.map((u) => {
                const kategori = u.product_categories as unknown as {
                  name: string;
                } | null;
                const kritikMi = u.stock_quantity <= u.critical_stock;
                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/panel/stok/${u.id}`}>
                        <span className="font-medium text-slate-200">
                          {u.name}
                        </span>
                        {u.sku && (
                          <span className="ml-2 font-mono text-xs text-slate-500">
                            {u.sku}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-400 md:table-cell">
                      {kategori?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-400 sm:table-cell">
                      {u.sale_price != null
                        ? paraFormatla(
                            toptanGorunum
                              ? kdvHaricFiyat(u.sale_price, u.vat_rate)
                              : u.sale_price,
                            ""
                          ) + " TL"
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          kritikMi
                            ? "bg-red-500/15 text-red-300"
                            : "bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {u.stock_quantity}
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
