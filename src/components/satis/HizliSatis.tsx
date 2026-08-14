"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { kalemEtiket, kalemIkon, ODEME_YONTEMLERI } from "@/lib/satis";

type Urun = { id: string; name: string; sku: string | null; stock_quantity: number; sale_price: number | null };
type Musteri = { id: string; name: string; phone: string | null };

type Kalem = {
  localId: string;
  item_type: "urun" | "iscilik" | "hizmet";
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
};

type Props = {
  tenantId: string;
};

let sayac = 0;
function yeniLocalId() {
  sayac += 1;
  return `k${sayac}`;
}

export function HizliSatis({ tenantId }: Props) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [aramaAcik, setAramaAcik] = useState(false);
  const aramaRef = useRef<HTMLInputElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [kalemler, setKalemler] = useState<Kalem[]>([]);

  const [serbestAcik, setSerbestAcik] = useState(false);
  const [serbestTip, setSerbestTip] = useState<"iscilik" | "hizmet">("iscilik");
  const [serbestAd, setSerbestAd] = useState("");
  const [serbestFiyat, setSerbestFiyat] = useState("");

  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [odemeYontemi, setOdemeYontemi] = useState<"nakit" | "kart" | "acik_hesap">("nakit");

  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<{ saleNo: string; toplam: number } | null>(null);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setAramaAcik(false);
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  // F2: aramaya odaklan (sayfanın herhangi bir yerinden)
  useEffect(() => {
    function kisayol(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        aramaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", kisayol);
    return () => window.removeEventListener("keydown", kisayol);
  }, []);

  useEffect(() => {
    if (arama.trim().length < 1) {
      setSonuclar([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const q = arama.trim();
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, sale_price")
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%,barcode.eq.${q}`)
        .eq("is_active", true)
        .limit(8);
      setSonuclar(data ?? []);
      setAramaAcik(true);
    }, 200);
    return () => clearTimeout(t);
  }, [arama]);

  function urunEkle(u: Urun) {
    setKalemler((k) => {
      const mevcut = k.find((x) => x.product_id === u.id);
      if (mevcut) {
        return k.map((x) => (x.product_id === u.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [
        ...k,
        {
          localId: yeniLocalId(),
          item_type: "urun",
          product_id: u.id,
          name: u.name,
          quantity: 1,
          unit_price: u.sale_price ?? 0,
        },
      ];
    });
    setArama("");
    setSonuclar([]);
    setAramaAcik(false);
    aramaRef.current?.focus();
  }

  function serbestKalemEkle() {
    const fiyat = Number(serbestFiyat);
    if (!serbestAd.trim() || Number.isNaN(fiyat) || fiyat < 0) return;
    setKalemler((k) => [
      ...k,
      {
        localId: yeniLocalId(),
        item_type: serbestTip,
        product_id: null,
        name: serbestAd.trim(),
        quantity: 1,
        unit_price: fiyat,
      },
    ]);
    setSerbestAd("");
    setSerbestFiyat("");
    setSerbestAcik(false);
  }

  function miktarGuncelle(localId: string, deger: string) {
    const sayi = Number(deger);
    setKalemler((k) =>
      k.map((x) => (x.localId === localId ? { ...x, quantity: Number.isNaN(sayi) ? x.quantity : sayi } : x))
    );
  }

  function fiyatGuncelle(localId: string, deger: string) {
    const sayi = Number(deger);
    setKalemler((k) =>
      k.map((x) => (x.localId === localId ? { ...x, unit_price: Number.isNaN(sayi) ? x.unit_price : sayi } : x))
    );
  }

  function kalemSil(localId: string) {
    setKalemler((k) => k.filter((x) => x.localId !== localId));
  }

  const toplam = kalemler.reduce((t, k) => t + k.quantity * k.unit_price, 0);

  async function satisiTamamla(negatifOnay = false) {
    if (!kalemler.length) return;
    setGonderiliyor(true);
    setHata(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("satis_olustur", {
      p_musteri_id: musteri?.id ?? null,
      p_kalemler: kalemler.map((k) => ({
        item_type: k.item_type,
        product_id: k.product_id,
        name: k.name,
        quantity: k.quantity,
        unit_price: k.unit_price,
      })),
      p_odeme_yontemi: odemeYontemi,
      p_negatif_onay: negatifOnay,
    });

    if (error) {
      setGonderiliyor(false);
      if (error.message.includes("NEGATIF_STOK_ONAY_GEREKLI")) {
        if (window.confirm("Bu satış bir üründe stoğu eksiye düşürecek. Yine de tamamlamak istiyor musunuz?")) {
          satisiTamamla(true);
        }
        return;
      }
      setHata(
        error.message.includes("STOK_YETERSIZ")
          ? "İşletme politikanız negatif stoğa izin vermiyor — stok yetersiz."
          : "Satış tamamlanamadı."
      );
      return;
    }

    const { data: satis } = await supabase.from("sales").select("sale_no").eq("id", data).single();

    setGonderiliyor(false);
    setBasari({ saleNo: satis?.sale_no ?? "—", toplam });
    setKalemler([]);
    setMusteri(null);
    setOdemeYontemi("nakit");
    router.refresh();
    aramaRef.current?.focus();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="relative" ref={kutuRef}>
          <input
            ref={aramaRef}
            type="text"
            autoFocus
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            onFocus={() => arama.trim().length >= 1 && setAramaAcik(true)}
            placeholder="🔍 Ürün ara veya barkod okut (F2)…"
            className="w-full rounded-lg border border-slate-700 bg-surface-2 px-4 py-3 text-base text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
          />
          {aramaAcik && sonuclar.length > 0 && (
            <div className="glass absolute inset-x-0 top-14 z-30 max-h-72 overflow-y-auto rounded-xl p-1.5 shadow-xl shadow-black/40">
              {sonuclar.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => urunEkle(u)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-nova-500/15"
                >
                  <span>
                    {u.name}
                    {u.sku && <span className="ml-2 font-mono text-xs text-slate-500">{u.sku}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {u.sale_price != null ? `${u.sale_price.toLocaleString("tr-TR")} TL` : "—"} · Stok: {u.stock_quantity}
                  </span>
                </button>
              ))}
            </div>
          )}
          {aramaAcik && arama.trim().length >= 1 && sonuclar.length === 0 && (
            <div className="glass absolute inset-x-0 top-14 z-30 rounded-xl p-3 text-center text-xs text-slate-500 shadow-xl">
              Ürün bulunamadı
            </div>
          )}
        </div>

        <div className="mt-2">
          {!serbestAcik ? (
            <button
              type="button"
              onClick={() => setSerbestAcik(true)}
              className="rounded-lg border border-dashed border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-nova-500/50 hover:text-nova-300"
            >
              + İşçilik / Hizmet Kalemi Ekle
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-surface-2 p-3">
              <select
                value={serbestTip}
                onChange={(e) => setSerbestTip(e.target.value as "iscilik" | "hizmet")}
                className="rounded-lg border border-slate-700 bg-surface px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              >
                <option value="iscilik">İşçilik</option>
                <option value="hizmet">Hizmet</option>
              </select>
              <input
                type="text"
                value={serbestAd}
                onChange={(e) => setSerbestAd(e.target.value)}
                placeholder="Açıklama (örn: Montaj)"
                className="min-w-[160px] flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={serbestFiyat}
                onChange={(e) => setSerbestFiyat(e.target.value)}
                placeholder="Tutar"
                className="w-28 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
              />
              <button
                type="button"
                onClick={serbestKalemEkle}
                disabled={!serbestAd.trim() || !serbestFiyat}
                className="rounded-lg bg-nova-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => setSerbestAcik(false)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400"
              >
                Vazgeç
              </button>
            </div>
          )}
        </div>

        <div className="glass mt-4 overflow-hidden rounded-xl">
          {!kalemler.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">
              Sepet boş — ürün arayın veya işçilik/hizmet ekleyin
            </p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {kalemler.map((k) => (
                <div key={k.localId} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-base">{kalemIkon(k.item_type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{k.name}</p>
                    <p className="text-[11px] text-slate-500">{kalemEtiket(k.item_type)}</p>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={k.quantity}
                    onChange={(e) => miktarGuncelle(k.localId, e.target.value)}
                    className="w-16 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-slate-200 outline-none focus:border-nova-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={k.unit_price}
                    onChange={(e) => fiyatGuncelle(k.localId, e.target.value)}
                    className="w-24 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-slate-200 outline-none focus:border-nova-500"
                  />
                  <span className="w-24 shrink-0 text-right text-sm font-semibold text-slate-200">
                    {(k.quantity * k.unit_price).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => kalemSil(k.localId)}
                    className="shrink-0 text-slate-500 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass h-fit rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400">Müşteri (opsiyonel)</p>
        <div className="mt-1.5">
          <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
        </div>

        <p className="mt-4 text-xs font-medium text-slate-400">Ödeme Yöntemi</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {(Object.keys(ODEME_YONTEMLERI) as Array<keyof typeof ODEME_YONTEMLERI>).map((k) => (
            <button
              key={k}
              type="button"
              disabled={k === "acik_hesap" && !musteri}
              onClick={() => setOdemeYontemi(k as typeof odemeYontemi)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                odemeYontemi === k
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {ODEME_YONTEMLERI[k]}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-baseline justify-between border-t border-slate-800 pt-4">
          <span className="text-sm text-slate-400">Toplam</span>
          <span className="text-2xl font-bold text-white">
            {toplam.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL
          </span>
        </div>

        {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}
        {basari && (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            ✓ {basari.saleNo} tamamlandı — {basari.toplam.toLocaleString("tr-TR")} TL
          </p>
        )}

        <button
          type="button"
          onClick={() => satisiTamamla()}
          disabled={!kalemler.length || gonderiliyor}
          className="mt-4 w-full rounded-lg bg-nova-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {gonderiliyor ? "Kaydediliyor…" : "Satışı Tamamla"}
        </button>
      </div>
    </div>
  );
}
