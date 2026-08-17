"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";

type Kalem = {
  feedItemId: string;
  productId: string;
  productName: string;
  sku: string | null;
  distributorName: string;
  distributorPrice: number;
  distributorCurrency: string;
  distributorStock: number;
  mevcutFiyat: number;
  onerilenFiyat: number | null;
};

type Props = {
  kalemler: Kalem[];
  yetkili: boolean;
  kurYok: boolean;
};

export function FeedFiyatKarsilastirma({ kalemler, yetkili, kurYok }: Props) {
  const router = useRouter();
  const degisenler = useMemo(
    () => kalemler.filter((k) => k.onerilenFiyat != null && k.onerilenFiyat !== k.mevcutFiyat),
    [kalemler]
  );
  const [secili, setSecili] = useState<Set<string>>(() => new Set(degisenler.map((k) => k.productId)));
  const [guncelleniyor, setGuncelleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);

  function toggle(id: string) {
    setSecili((s) => {
      const yeni = new Set(s);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  async function guncelle() {
    const hedefler = degisenler.filter((k) => secili.has(k.productId));
    if (!hedefler.length) return;
    setGuncelleniyor(true);
    setSonuc(null);
    const supabase = createClient();
    const sonuclar = await Promise.all(
      hedefler.map((k) => supabase.from("products").update({ sale_price: k.onerilenFiyat }).eq("id", k.productId))
    );
    const basarili = sonuclar.filter((r) => !r.error).length;
    if (basarili > 0) {
      await supabase.rpc("audit_ekle", {
        p_action: "toptanci_fiyati_uygulandi",
        p_entity: "product",
        p_new: {
          urun_sayisi: basarili,
          urunler: hedefler.slice(0, basarili).map((k) => ({ id: k.productId, ad: k.productName, eski: k.mevcutFiyat, yeni: k.onerilenFiyat })),
        },
      });
    }
    setGuncelleniyor(false);
    setSonuc(`${basarili} üründe satış fiyatı güncellendi.`);
    router.refresh();
  }

  if (!kalemler.length) {
    return (
      <div className="glass rounded-xl p-6 text-center text-sm text-slate-500">
        Bu feed'de kendi stoğunuzla eşleşen ürün yok.
      </div>
    );
  }

  if (kurYok) {
    return (
      <div className="glass rounded-xl p-6 text-center text-sm text-amber-300">
        USD kuru tanımlı değil — fiyat önerisi hesaplanamıyor. Ayarlar → Döviz Kurları&apos;nı
        kontrol edin.
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-400">
          {degisenler.length > 0
            ? `${degisenler.length} üründe distribütör fiyatıyla fark var`
            : "Tüm eşleşen ürünlerin fiyatı distribütör verisiyle uyumlu"}
        </p>
        {yetkili && degisenler.length > 0 && (
          <button
            type="button"
            onClick={guncelle}
            disabled={guncelleniyor || secili.size === 0}
            className="rounded-lg bg-nova-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guncelleniyor ? "Güncelleniyor…" : `Seçilenleri Güncelle (${secili.size})`}
          </button>
        )}
      </div>

      {sonuc && (
        <p className="border-b border-slate-800 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">{sonuc}</p>
      )}

      <div className="divide-y divide-slate-800/60">
        {kalemler.map((k) => {
          const degisti = k.onerilenFiyat != null && k.onerilenFiyat !== k.mevcutFiyat;
          const artis = (k.onerilenFiyat ?? 0) > k.mevcutFiyat;
          return (
            <label
              key={k.feedItemId}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800/30"
            >
              {yetkili && degisti && (
                <input
                  type="checkbox"
                  checked={secili.has(k.productId)}
                  onChange={() => toggle(k.productId)}
                  className="h-4 w-4 shrink-0 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">{k.productName}</p>
                <p className="text-[11px] text-slate-500">
                  {k.distributorPrice.toLocaleString("tr-TR")} {k.distributorCurrency} ·{" "}
                  {k.distributorStock} adet distribütörde
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500 line-through">{paraFormatla(k.mevcutFiyat)}</p>
                <p className={`text-sm font-semibold ${degisti ? (artis ? "text-emerald-300" : "text-red-300") : "text-slate-400"}`}>
                  {k.onerilenFiyat != null ? paraFormatla(k.onerilenFiyat) : "—"}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
