import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { etkinKurlar, fiyatHesapla } from "@/lib/doviz";
import { TOPTANCI_SAGLAYICILAR, type ToptanciSaglayici } from "@/lib/tedarikciFeed";
import { FeedFiyatKarsilastirma } from "@/components/tedarikci/FeedFiyatKarsilastirma";

export const metadata: Metadata = { title: "Toptancı Fiyatları — ByteNova" };

export default async function XmlFiyatlariPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  const { data: tedarikci } = await supabase.from("suppliers").select("id, name").eq("id", id).maybeSingle();
  if (!tedarikci) notFound();

  const { data: stokPlus } = await supabase
    .from("tenant_addon_subscriptions")
    .select("status")
    .eq("addon_key", "stok_plus")
    .maybeSingle();
  if (stokPlus?.status !== "active" && stokPlus?.status !== "trial") redirect(`/panel/tedarikciler/${id}`);

  const { data: feed } = await supabase
    .from("supplier_feeds")
    .select("id, provider_key, last_synced_at")
    .eq("supplier_id", id)
    .maybeSingle();
  if (!feed) redirect(`/panel/tedarikciler/${id}`);

  const { data: kalemlerHam } = await supabase
    .from("supplier_feed_items")
    .select(
      "id, external_code, barcode, name, price, currency, stock_quantity, matched_product_id, " +
        "products:matched_product_id (id, name, sku, sale_price, price_margin, auto_price)"
    )
    .eq("feed_id", feed.id)
    .order("name");

  const kurlar = await etkinKurlar(supabase);
  const kur = kurlar.get("USD")?.rate_to_try ?? null;

  const kalemler = (kalemlerHam ?? []) as unknown as {
    id: string;
    external_code: string;
    barcode: string | null;
    name: string;
    price: number;
    currency: string;
    stock_quantity: number;
    matched_product_id: string | null;
    products: { id: string; name: string; sku: string | null; sale_price: number; price_margin: number | null; auto_price: boolean } | null;
  }[];

  const eslesenler = kalemler
    .filter((k) => k.matched_product_id && k.products)
    .map((k) => {
      const onerilenFiyat = kur != null ? fiyatHesapla(k.price, kur, k.products!.price_margin ?? 0) : null;
      return {
        feedItemId: k.id,
        productId: k.products!.id,
        productName: k.products!.name,
        sku: k.products!.sku,
        distributorName: k.name,
        distributorPrice: k.price,
        distributorCurrency: k.currency,
        distributorStock: k.stock_quantity,
        mevcutFiyat: k.products!.sale_price,
        onerilenFiyat,
      };
    });

  const firsatlar = kalemler.filter((k) => !k.matched_product_id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/panel/tedarikciler/${id}`}
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← {tedarikci.name}
      </Link>
      <h1 className="mt-2 text-xl font-bold text-white">
        📡 {TOPTANCI_SAGLAYICILAR[feed.provider_key as ToptanciSaglayici]}
      </h1>
      <p className="mt-0.5 text-sm text-slate-400">
        {feed.last_synced_at
          ? `Son senkron: ${new Date(feed.last_synced_at).toLocaleString("tr-TR")}`
          : "Henüz senkronize edilmedi"}{" "}
        — {kalemler.length} kalem, {eslesenler.length} tanesi kendi stoğunuzla eşleşti.
      </p>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-white">Fiyat Karşılaştırması</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Eşleşen ürünler için distribütör fiyatı × güncel kur × ürünün kâr marjı ile önerilen
          satış fiyatı hesaplanır (yalnızca &quot;satış fiyatını otomatik hesapla&quot; işaretli
          ürünlerde marj uygulanır — diğerlerinde referans olarak 0 marjla gösterilir).
        </p>
        <div className="mt-3">
          <FeedFiyatKarsilastirma kalemler={eslesenler} yetkili={yetkili} kurYok={kur == null} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-white">
          Fırsat Listesi <span className="text-slate-500">— toptancıda var, sizde yok</span>
        </h2>
        {!firsatlar.length ? (
          <div className="glass mt-3 rounded-xl p-6 text-center text-sm text-slate-500">
            Distribütör kataloğundaki tüm kalemler kendi stoğunuzla eşleşiyor.
          </div>
        ) : (
          <div className="glass mt-3 overflow-hidden rounded-xl">
            <div className="divide-y divide-slate-800/60">
              {firsatlar.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{f.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {f.external_code} {f.barcode && `· ${f.barcode}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-200">
                      {f.price.toLocaleString("tr-TR")} {f.currency}
                    </p>
                    <p className="text-[11px] text-slate-500">{f.stock_quantity} adet distribütörde</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
