"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TedarikciSec } from "./TedarikciSec";

type Tedarikci = { id: string; name: string; currency: string };
type Urun = { id: string; name: string; sku: string | null };

type Kalem = {
  localId: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

type Props = {
  tenantId: string;
  kurlar: Record<string, number>; // code -> 1 birimin TL karşılığı
  baslangicTedarikci?: Tedarikci | null;
  baslangicKalem?: { product_id: string; name: string; quantity: number } | null;
};

let sayac = 0;
function yeniLocalId() {
  sayac += 1;
  return `k${sayac}`;
}

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

// "sv-SE" biçimi YYYY-MM-DD üretir; input[type=date] ile birebir uyumlu.
const bugun = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

export function AlisFormu({ tenantId, kurlar, baslangicTedarikci, baslangicKalem }: Props) {
  const router = useRouter();
  const [tedarikci, setTedarikci] = useState<Tedarikci | null>(baslangicTedarikci ?? null);
  const [faturaNo, setFaturaNo] = useState("");
  const [faturaTarihi, setFaturaTarihi] = useState(bugun());
  const [paraBirimi, setParaBirimi] = useState(baslangicTedarikci?.currency ?? "TRY");
  const [kur, setKur] = useState(
    baslangicTedarikci && baslangicTedarikci.currency !== "TRY"
      ? (kurlar[baslangicTedarikci.currency]?.toString() ?? "1")
      : "1"
  );
  const [odemeDurumu, setOdemeDurumu] = useState<"odenmedi" | "kismi" | "odendi">("odenmedi");
  const [notlar, setNotlar] = useState("");

  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [aramaAcik, setAramaAcik] = useState(false);
  const aramaRef = useRef<HTMLInputElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [kalemler, setKalemler] = useState<Kalem[]>(() =>
    baslangicKalem
      ? [{ localId: yeniLocalId(), product_id: baslangicKalem.product_id, name: baslangicKalem.name, quantity: baslangicKalem.quantity, unit_price: 0 }]
      : []
  );
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<{ id: string; no: string } | null>(null);

  function paraBirimiDegistir(kod: string) {
    setParaBirimi(kod);
    setKur(kod === "TRY" ? "1" : (kurlar[kod]?.toString() ?? ""));
  }

  function tedarikciSec(t: Tedarikci | null) {
    setTedarikci(t);
    if (t) paraBirimiDegistir(t.currency);
  }

  async function urunAra(q: string) {
    setArama(q);
    if (q.trim().length < 1) {
      setSonuclar([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, sku")
      .or(`name.ilike.%${q.trim()}%,sku.ilike.%${q.trim()}%,barcode.ilike.%${q.trim()}%`)
      .eq("is_active", true)
      .limit(8);
    setSonuclar(data ?? []);
    setAramaAcik(true);
  }

  function urunEkle(u: Urun) {
    setKalemler((k) => {
      const mevcut = k.find((x) => x.product_id === u.id);
      if (mevcut) return k.map((x) => (x.product_id === u.id ? { ...x, quantity: x.quantity + 1 } : x));
      return [...k, { localId: yeniLocalId(), product_id: u.id, name: u.name, quantity: 1, unit_price: 0 }];
    });
    setArama("");
    setSonuclar([]);
    setAramaAcik(false);
    aramaRef.current?.focus();
  }

  function kalemGuncelle(localId: string, alan: "quantity" | "unit_price", deger: string) {
    const sayi = Number(deger);
    setKalemler((k) => k.map((x) => (x.localId === localId ? { ...x, [alan]: Number.isNaN(sayi) ? x[alan] : sayi } : x)));
  }

  function kalemSil(localId: string) {
    setKalemler((k) => k.filter((x) => x.localId !== localId));
  }

  const toplam = kalemler.reduce((t, k) => t + k.quantity * k.unit_price, 0);
  const kurSayi = Number(kur) || 0;
  const toplamTL = paraBirimi === "TRY" ? toplam : toplam * kurSayi;

  async function kaydet() {
    if (!tedarikci) {
      setHata("Tedarikçi seçin.");
      return;
    }
    if (!kalemler.length) {
      setHata("En az bir ürün ekleyin.");
      return;
    }
    if (paraBirimi !== "TRY" && kurSayi <= 0) {
      setHata("Geçerli bir kur girin.");
      return;
    }
    setGonderiliyor(true);
    setHata(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("alis_olustur", {
      p_supplier_id: tedarikci.id,
      p_supplier_invoice_no: faturaNo.trim() || null,
      p_invoice_date: faturaTarihi,
      p_currency: paraBirimi,
      p_exchange_rate: paraBirimi === "TRY" ? 1 : kurSayi,
      p_kalemler: kalemler.map((k) => ({
        product_id: k.product_id,
        quantity: k.quantity,
        unit_price: k.unit_price,
      })),
      p_payment_status: odemeDurumu,
      p_notes: notlar.trim() || null,
    });

    if (error) {
      setGonderiliyor(false);
      setHata("Alış kaydedilemedi. Lütfen bilgileri kontrol edin.");
      return;
    }

    const { data: alis } = await supabase.from("purchases").select("purchase_no").eq("id", data).single();

    setGonderiliyor(false);
    setBasari({ id: data as string, no: alis?.purchase_no ?? "—" });
    setKalemler([]);
    setFaturaNo("");
    setNotlar("");
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Tedarikçi</p>
          <div className="mt-1.5">
            <TedarikciSec tenantId={tenantId} secili={tedarikci} onSec={tedarikciSec} />
          </div>
        </div>

        <div className="relative mt-4" ref={kutuRef}>
          <input
            ref={aramaRef}
            type="text"
            value={arama}
            onChange={(e) => urunAra(e.target.value)}
            onFocus={() => arama.trim().length >= 1 && setAramaAcik(true)}
            placeholder="🔍 Ürün ara veya barkod okut…"
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
                  <span>{u.name}</span>
                  {u.sku && <span className="shrink-0 font-mono text-xs text-slate-500">{u.sku}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass mt-4 overflow-hidden rounded-xl">
          {!kalemler.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">
              Sepet boş — alışta gelen ürünleri arayıp ekleyin
            </p>
          ) : (
            <>
              <div className="hidden grid-cols-[1fr_80px_100px_100px_24px] gap-2 border-b border-slate-800 px-4 py-2 text-[10px] uppercase tracking-wide text-slate-500 sm:grid">
                <span>Ürün</span>
                <span className="text-right">Adet</span>
                <span className="text-right">Birim Fiyat</span>
                <span className="text-right">Tutar</span>
                <span />
              </div>
              <div className="divide-y divide-slate-800/60">
                {kalemler.map((k) => (
                  <div
                    key={k.localId}
                    className="flex flex-wrap items-center gap-2 px-4 py-2.5 sm:grid sm:grid-cols-[1fr_80px_100px_100px_24px]"
                  >
                    <p className="min-w-0 truncate text-sm text-slate-200">{k.name}</p>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={k.quantity}
                      onChange={(e) => kalemGuncelle(k.localId, "quantity", e.target.value)}
                      className="w-20 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-slate-200 outline-none focus:border-nova-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={k.unit_price || ""}
                      onChange={(e) => kalemGuncelle(k.localId, "unit_price", e.target.value)}
                      placeholder="0.00"
                      className="w-24 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-nova-500"
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
            </>
          )}
        </div>
      </div>

      <div className="glass h-fit rounded-xl p-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-medium text-slate-400">Fatura No</p>
            <input
              type="text"
              value={faturaNo}
              onChange={(e) => setFaturaNo(e.target.value)}
              placeholder="Opsiyonel"
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Fatura Tarihi</p>
            <input
              type="date"
              value={faturaTarihi}
              max={bugun()}
              onChange={(e) => setFaturaTarihi(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-medium text-slate-400">Para Birimi</p>
            <select
              value={paraBirimi}
              onChange={(e) => paraBirimiDegistir(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
            >
              <option value="TRY">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Kur</p>
            <input
              type="number"
              step="0.0001"
              min="0"
              disabled={paraBirimi === "TRY"}
              value={kur}
              onChange={(e) => setKur(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500 disabled:opacity-40"
            />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-slate-400">Ödeme Durumu</p>
          <select
            value={odemeDurumu}
            onChange={(e) => setOdemeDurumu(e.target.value as "odenmedi" | "kismi" | "odendi")}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
          >
            <option value="odenmedi">Ödenmedi</option>
            <option value="kismi">Kısmi Ödendi</option>
            <option value="odendi">Ödendi</option>
          </select>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-slate-400">Not</p>
          <input
            type="text"
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            placeholder="Opsiyonel"
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
        </div>

        <div className="mt-4 space-y-1 border-t border-slate-800 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-400">Toplam</span>
            <span className="text-2xl font-bold text-white">
              {toplam.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {paraBirimi}
            </span>
          </div>
          {paraBirimi !== "TRY" && kurSayi > 0 && (
            <p className="text-right text-xs text-slate-500">
              ≈ {toplamTL.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL
            </p>
          )}
        </div>

        {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}
        {basari && (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            ✓{" "}
            <Link href={`/panel/alis/${basari.id}`} className="underline hover:text-emerald-100">
              {basari.no}
            </Link>{" "}
            kaydedildi — stok ve ürün maliyetleri güncellendi.
          </p>
        )}

        <button
          type="button"
          onClick={kaydet}
          disabled={gonderiliyor || !kalemler.length || !tedarikci}
          className="mt-4 w-full rounded-lg bg-nova-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {gonderiliyor ? "Kaydediliyor…" : "Alışı Kaydet"}
        </button>
      </div>
    </div>
  );
}
