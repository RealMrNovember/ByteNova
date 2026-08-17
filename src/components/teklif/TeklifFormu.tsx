"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { TAKIP_EDILEN_KURLAR, paraFormatla } from "@/lib/doviz";

type Urun = { id: string; name: string; sku: string | null; sale_price: number | null };
type Musteri = { id: string; name: string; phone: string | null };
type Kalem = {
  localId: string;
  item_type: "urun" | "iscilik" | "hizmet";
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
};

let sayac = 0;
function yeniLocalId() {
  sayac += 1;
  return `k${sayac}`;
}

type Props = {
  tenantId: string;
  kurlar: Record<string, number>;
};

export function TeklifFormu({ tenantId, kurlar }: Props) {
  const router = useRouter();
  const [musteri, setMusteri] = useState<Musteri | null>(null);

  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [aramaAcik, setAramaAcik] = useState(false);
  const kutuRef = useRef<HTMLDivElement>(null);
  const [kalemler, setKalemler] = useState<Kalem[]>([]);

  const [serbestAcik, setSerbestAcik] = useState(false);
  const [serbestTip, setSerbestTip] = useState<"iscilik" | "hizmet">("iscilik");
  const [serbestAd, setSerbestAd] = useState("");
  const [serbestFiyat, setSerbestFiyat] = useState("");

  const [paraBirimi, setParaBirimi] = useState("TRY");
  const [gecerlilikGun, setGecerlilikGun] = useState("14");
  const [genelIskonto, setGenelIskonto] = useState("");
  const [not, setNot] = useState("");

  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setAramaAcik(false);
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  useEffect(() => {
    if (arama.trim().length < 1) {
      setSonuclar([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, sale_price")
        .or(`name.ilike.%${arama.trim()}%,sku.ilike.%${arama.trim()}%`)
        .eq("is_active", true)
        .limit(8);
      setSonuclar(data ?? []);
      setAramaAcik(true);
    }, 200);
    return () => clearTimeout(t);
  }, [arama]);

  function urunEkle(u: Urun) {
    setKalemler((k) => [
      ...k,
      {
        localId: yeniLocalId(),
        item_type: "urun",
        product_id: u.id,
        name: u.name,
        quantity: 1,
        unit_price: u.sale_price ?? 0,
        discount_amount: 0,
      },
    ]);
    setArama("");
    setSonuclar([]);
    setAramaAcik(false);
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
        discount_amount: 0,
      },
    ]);
    setSerbestAd("");
    setSerbestFiyat("");
    setSerbestAcik(false);
  }

  function kalemAlanGuncelle(localId: string, alan: "quantity" | "unit_price" | "discount_amount", deger: string) {
    const sayi = Number(deger);
    setKalemler((k) => k.map((x) => (x.localId === localId ? { ...x, [alan]: Number.isNaN(sayi) ? x[alan] : sayi } : x)));
  }

  function kalemSil(localId: string) {
    setKalemler((k) => k.filter((x) => x.localId !== localId));
  }

  const kalemlerToplami = kalemler.reduce((t, k) => t + k.quantity * k.unit_price, 0);
  const satirIskontolari = kalemler.reduce((t, k) => t + (k.discount_amount || 0), 0);
  const subtotal = kalemlerToplami - satirIskontolari;
  const genelIskontoSayi = Number(genelIskonto) || 0;
  const toplam = Math.max(subtotal - genelIskontoSayi, 0);
  const sembol = paraBirimi === "TRY" ? "₺" : paraBirimi;
  const kur = paraBirimi === "TRY" ? 1 : kurlar[paraBirimi] ?? 0;

  async function kaydet() {
    setHata(null);
    if (!musteri) return setHata("Lütfen müşteri seçin.");
    if (kalemler.length === 0) return setHata("En az bir kalem ekleyin.");
    if (paraBirimi !== "TRY" && !kur) return setHata("Bu para birimi için tanımlı kur bulunamadı.");

    setGonderiliyor(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("teklif_olustur", {
      p_musteri_id: musteri.id,
      p_kalemler: kalemler.map((k) => ({
        item_type: k.item_type,
        product_id: k.product_id,
        name: k.name,
        quantity: k.quantity,
        unit_price: k.unit_price,
        discount_amount: k.discount_amount,
      })),
      p_para_birimi: paraBirimi,
      p_kur: kur,
      p_gecerlilik_gun: Number(gecerlilikGun) || 14,
      p_genel_iskonto: genelIskontoSayi,
      p_not: not.trim() || null,
    });

    setGonderiliyor(false);
    if (error || !data) {
      setHata("Teklif oluşturulamadı.");
      return;
    }
    router.push(`/panel/teklifler/${data}`);
    router.refresh();
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Müşteri *</label>
        <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
      </div>

      <div className="relative" ref={kutuRef}>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Ürün Ekle</label>
        <input
          type="text"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          onFocus={() => sonuclar.length > 0 && setAramaAcik(true)}
          placeholder="🔍 Ürün ara…"
          className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        {aramaAcik && sonuclar.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-surface-2 shadow-xl">
            {sonuclar.map((u) => (
              <button
                key={u.id}
                onClick={() => urunEkle(u)}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                <span>{u.name}</span>
                <span className="text-xs text-slate-500">{paraFormatla(u.sale_price ?? 0)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        {!serbestAcik ? (
          <button
            onClick={() => setSerbestAcik(true)}
            className="text-xs text-nova-300 hover:text-nova-50"
          >
            + İşçilik/hizmet kalemi ekle
          </button>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-surface px-3 py-2.5">
            <select
              value={serbestTip}
              onChange={(e) => setSerbestTip(e.target.value as "iscilik" | "hizmet")}
              className="rounded-lg border border-slate-700 bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="iscilik">İşçilik</option>
              <option value="hizmet">Hizmet</option>
            </select>
            <input
              type="text"
              value={serbestAd}
              onChange={(e) => setSerbestAd(e.target.value)}
              placeholder="Açıklama"
              className="min-w-[160px] flex-1 rounded-lg border border-slate-700 bg-surface-2 px-2.5 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
            />
            <input
              type="number"
              step="0.01"
              value={serbestFiyat}
              onChange={(e) => setSerbestFiyat(e.target.value)}
              placeholder="Fiyat"
              className="w-24 rounded-lg border border-slate-700 bg-surface-2 px-2.5 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
            />
            <button onClick={serbestKalemEkle} className="rounded-lg bg-nova-500 px-3 py-1.5 text-xs font-semibold text-slate-950">
              Ekle
            </button>
            <button onClick={() => setSerbestAcik(false)} className="text-xs text-slate-500">
              Vazgeç
            </button>
          </div>
        )}
      </div>

      {kalemler.length > 0 && (
        <div className="mt-4 divide-y divide-slate-800/60 rounded-lg border border-slate-800">
          {kalemler.map((k) => (
            <div key={k.localId} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-200">{k.name}</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={k.quantity}
                onChange={(e) => kalemAlanGuncelle(k.localId, "quantity", e.target.value)}
                className="w-16 rounded-lg border border-slate-700 bg-surface px-2 py-1 text-xs text-slate-200 outline-none"
              />
              <input
                type="number"
                step="0.01"
                value={k.unit_price}
                onChange={(e) => kalemAlanGuncelle(k.localId, "unit_price", e.target.value)}
                className="w-24 rounded-lg border border-slate-700 bg-surface px-2 py-1 text-xs text-slate-200 outline-none"
              />
              <button onClick={() => kalemSil(k.localId)} className="text-xs text-red-400 hover:text-red-300">
                Sil
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Para Birimi</label>
          <select
            value={paraBirimi}
            onChange={(e) => setParaBirimi(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none"
          >
            <option value="TRY">TRY</option>
            {TAKIP_EDILEN_KURLAR.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Geçerlilik (gün)</label>
          <input
            type="number"
            min="1"
            value={gecerlilikGun}
            onChange={(e) => setGecerlilikGun(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Genel İskonto ({sembol})</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={genelIskonto}
            onChange={(e) => setGenelIskonto(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Not (opsiyonel)</label>
        <input
          type="text"
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Teklife eklenecek serbest not"
          className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
        <span className="text-sm font-medium text-slate-300">Toplam</span>
        <span className="text-lg font-bold text-nova-300">
          {sembol}
          {toplam.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
        </span>
      </div>

      {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}

      <button
        onClick={kaydet}
        disabled={gonderiliyor}
        className="mt-4 w-full rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
      >
        {gonderiliyor ? "Kaydediliyor…" : "Teklifi Oluştur"}
      </button>
    </div>
  );
}
