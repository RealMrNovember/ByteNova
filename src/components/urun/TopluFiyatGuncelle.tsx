"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";

type Urun = {
  id: string;
  name: string;
  sku: string | null;
  purchase_price: number | null;
  purchase_currency: string;
  kur: number | null;
  mevcutFiyat: number | null;
  onerilenFiyat: number | null;
};

type Props = {
  urunler: Urun[];
  yetkili: boolean;
};

export function TopluFiyatGuncelle({ urunler, yetkili }: Props) {
  const router = useRouter();
  const degisenler = useMemo(
    () => urunler.filter((u) => u.onerilenFiyat !== u.mevcutFiyat),
    [urunler]
  );
  const [secili, setSecili] = useState<Set<string>>(
    () => new Set(degisenler.map((u) => u.id))
  );
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

  async function topluGuncelle() {
    const hedefler = degisenler.filter((u) => secili.has(u.id));
    if (!hedefler.length) return;
    setGuncelleniyor(true);
    setSonuc(null);

    const supabase = createClient();
    const sonuclar = await Promise.all(
      hedefler.map((u) =>
        supabase
          .from("products")
          .update({ sale_price: u.onerilenFiyat })
          .eq("id", u.id)
      )
    );
    const basarili = sonuclar.filter((r) => !r.error).length;

    if (basarili > 0) {
      await supabase.rpc("audit_ekle", {
        p_action: "toplu_fiyat_guncellendi",
        p_entity: "product",
        p_new: {
          urun_sayisi: basarili,
          urunler: hedefler
            .slice(0, basarili)
            .map((u) => ({ id: u.id, ad: u.name, eski: u.mevcutFiyat, yeni: u.onerilenFiyat })),
        },
      });
    }

    setGuncelleniyor(false);
    setSonuc(`${basarili} üründe satış fiyatı güncellendi.`);
    router.refresh();
  }

  if (!urunler.length) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-sm text-slate-400">
          Dövizli alış maliyetiyle otomatik fiyatlanan aktif ürün bulunamadı.
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Bu ekran yalnızca ürün formunda &quot;satış fiyatını otomatik hesapla&quot;
          işaretli, dövizli ürünleri listeler.
        </p>
      </div>
    );
  }

  if (!degisenler.length) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <span className="text-3xl">✓</span>
        <p className="mt-2 text-sm text-slate-300">
          {sonuc ?? "Tüm dövizli ürünlerin fiyatı güncel kurla uyumlu."}
        </p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-400">
          {degisenler.length} üründe kur değişimi nedeniyle fiyat farkı var
        </p>
        {yetkili && (
          <button
            onClick={topluGuncelle}
            disabled={guncelleniyor || secili.size === 0}
            className="rounded-lg bg-nova-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guncelleniyor
              ? "Güncelleniyor…"
              : `Seçilenleri Güncelle (${secili.size})`}
          </button>
        )}
      </div>

      {sonuc && (
        <p className="border-b border-slate-800 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">
          {sonuc}
        </p>
      )}

      <div className="divide-y divide-slate-800/60">
        {degisenler.map((u) => {
          const artis = (u.onerilenFiyat ?? 0) > (u.mevcutFiyat ?? 0);
          return (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800/30"
            >
              {yetkili && (
                <input
                  type="checkbox"
                  checked={secili.has(u.id)}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">{u.name}</p>
                <p className="text-[11px] text-slate-500">
                  {u.purchase_price?.toLocaleString("tr-TR")} {u.purchase_currency} × 1{" "}
                  {u.purchase_currency} = {u.kur?.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500 line-through">
                  {u.mevcutFiyat != null ? paraFormatla(u.mevcutFiyat) : "—"}
                </p>
                <p
                  className={`text-sm font-semibold ${artis ? "text-emerald-300" : "text-red-300"}`}
                >
                  {u.onerilenFiyat != null ? paraFormatla(u.onerilenFiyat) : "—"}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
