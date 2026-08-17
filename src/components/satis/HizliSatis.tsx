"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import Link from "next/link";
import { kalemEtiket, kalemIkon, ODEME_YONTEMLERI } from "@/lib/satis";
import { YoneticiOnayModal } from "./YoneticiOnayModal";

type Urun = { id: string; name: string; sku: string | null; stock_quantity: number; sale_price: number | null; is_digital: boolean };
type Musteri = { id: string; name: string; phone: string | null };
type OdemeYontemi = "nakit" | "kart" | "acik_hesap";
type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Kalem = {
  localId: string;
  item_type: "urun" | "iscilik" | "hizmet";
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
};

type OdemeSatiri = {
  localId: string;
  method: OdemeYontemi;
  amount: string;
  installments: number;
  accountId: string;
};

type Props = {
  tenantId: string;
  maxTaksit: number;
  kasaHesaplari: KasaHesabi[];
};

// nakit ödeme → nakit tipi hesaplar; kart ödeme → POS/banka hesapları
function uygunHesaplar(kasaHesaplari: KasaHesabi[], method: OdemeYontemi): KasaHesabi[] {
  if (method === "acik_hesap") return [];
  if (method === "nakit") return kasaHesaplari.filter((h) => h.type === "nakit");
  return kasaHesaplari.filter((h) => h.type === "pos" || h.type === "banka");
}

let sayac = 0;
function yeniLocalId() {
  sayac += 1;
  return `k${sayac}`;
}

const paraFmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

export function HizliSatis({ tenantId, maxTaksit, kasaHesaplari }: Props) {
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

  const [genelIskonto, setGenelIskonto] = useState("");
  const [yuvarlamaAktif, setYuvarlamaAktif] = useState(false);

  const [belgeTipi, setBelgeTipi] = useState<"okc_fisi" | "sonra_kesilecek">("sonra_kesilecek");
  const [fisNo, setFisNo] = useState("");

  const [odemeMod, setOdemeMod] = useState<"tek" | "karma">("tek");
  const [tekYontem, setTekYontem] = useState<OdemeYontemi>("nakit");
  const [tekTaksit, setTekTaksit] = useState(1);
  const [tekHesapId, setTekHesapId] = useState("");
  const [karmaSatirlar, setKarmaSatirlar] = useState<OdemeSatiri[]>([]);

  // Ödeme yöntemi değişince uygun tek hesap varsa otomatik seç
  useEffect(() => {
    const uygun = uygunHesaplar(kasaHesaplari, tekYontem);
    if (uygun.length === 1) setTekHesapId(uygun[0].id);
    else if (!uygun.some((h) => h.id === tekHesapId)) setTekHesapId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekYontem, kasaHesaplari]);

  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<{ saleId: string; saleNo: string; toplam: number } | null>(null);
  const [iskontoOnayBekleniyor, setIskontoOnayBekleniyor] = useState<{ negatifOnay: boolean } | null>(null);

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
        .select("id, name, sku, stock_quantity, sale_price, is_digital")
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
          discount_amount: 0,
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
        discount_amount: 0,
      },
    ]);
    setSerbestAd("");
    setSerbestFiyat("");
    setSerbestAcik(false);
  }

  function kalemAlanGuncelle(localId: string, alan: "quantity" | "unit_price" | "discount_amount", deger: string) {
    const sayi = Number(deger);
    setKalemler((k) =>
      k.map((x) => (x.localId === localId ? { ...x, [alan]: Number.isNaN(sayi) ? x[alan] : sayi } : x))
    );
  }

  function kalemSil(localId: string) {
    setKalemler((k) => k.filter((x) => x.localId !== localId));
  }

  // ---------- Toplamlar ----------
  const kalemlerToplami = kalemler.reduce((t, k) => t + k.quantity * k.unit_price, 0);
  const satirIskontolari = kalemler.reduce((t, k) => t + (k.discount_amount || 0), 0);
  const subtotal = kalemlerToplami - satirIskontolari;
  const genelIskontoSayi = Number(genelIskonto) || 0;
  const araToplam = Math.max(subtotal - genelIskontoSayi, 0);
  const yuvarlamaTutari = yuvarlamaAktif ? -(araToplam - Math.floor(araToplam)) : 0;
  const toplam = araToplam + yuvarlamaTutari;

  // ---------- Ödeme satırları ----------
  function karmaModunaGec() {
    setKarmaSatirlar([
      {
        localId: yeniLocalId(),
        method: tekYontem,
        amount: toplam.toFixed(2),
        installments: tekYontem === "kart" ? tekTaksit : 1,
        accountId: tekHesapId,
      },
    ]);
    setOdemeMod("karma");
  }
  function tekModaDon() {
    setOdemeMod("tek");
    setKarmaSatirlar([]);
  }
  function karmaSatirEkle() {
    const simdikiToplam = karmaSatirlar.reduce((t, o) => t + (Number(o.amount) || 0), 0);
    const kalan = Math.max(toplam - simdikiToplam, 0);
    const uygun = uygunHesaplar(kasaHesaplari, "nakit");
    setKarmaSatirlar((s) => [
      ...s,
      {
        localId: yeniLocalId(),
        method: "nakit",
        amount: kalan ? kalan.toFixed(2) : "",
        installments: 1,
        accountId: uygun.length === 1 ? uygun[0].id : "",
      },
    ]);
  }
  function karmaSatirSil(localId: string) {
    setKarmaSatirlar((s) => s.filter((x) => x.localId !== localId));
  }
  function karmaSatirGuncelle(localId: string, degisiklik: Partial<OdemeSatiri>) {
    setKarmaSatirlar((s) => s.map((x) => (x.localId === localId ? { ...x, ...degisiklik } : x)));
  }

  function karmaYontemDegistir(localId: string, method: OdemeYontemi) {
    const uygun = uygunHesaplar(kasaHesaplari, method);
    karmaSatirGuncelle(localId, { method, accountId: uygun.length === 1 ? uygun[0].id : "" });
  }

  const karmaOdenen = karmaSatirlar.reduce((t, o) => t + (Number(o.amount) || 0), 0);
  const karmaKalan = toplam - karmaOdenen;

  function odemelerYuku(): { method: string; amount: number; installments: number | null; account_id: string | null }[] {
    if (odemeMod === "tek") {
      return [
        {
          method: tekYontem,
          amount: toplam,
          installments: tekYontem === "kart" && tekTaksit > 1 ? tekTaksit : null,
          account_id: tekYontem === "acik_hesap" ? null : tekHesapId || null,
        },
      ];
    }
    return karmaSatirlar.map((o) => ({
      method: o.method,
      amount: Number(o.amount) || 0,
      installments: o.method === "kart" && o.installments > 1 ? o.installments : null,
      account_id: o.method === "acik_hesap" ? null : o.accountId || null,
    }));
  }

  const acikHesapSeciliMi =
    odemeMod === "tek" ? tekYontem === "acik_hesap" : karmaSatirlar.some((o) => o.method === "acik_hesap");

  const hesapEksikMi =
    odemeMod === "tek"
      ? tekYontem !== "acik_hesap" && !tekHesapId
      : karmaSatirlar.some((o) => o.method !== "acik_hesap" && !o.accountId);

  async function satisiTamamla(negatifOnay = false, iskontoOnaylayanId: string | null = null) {
    if (!kalemler.length) return;
    if (odemeMod === "karma" && Math.abs(karmaKalan) > 0.01) return;

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
        discount_amount: k.discount_amount || 0,
      })),
      p_odemeler: odemelerYuku(),
      p_genel_iskonto: genelIskontoSayi,
      p_yuvarlama: yuvarlamaTutari,
      p_iskonto_onaylayan_id: iskontoOnaylayanId,
      p_negatif_onay: negatifOnay,
      p_belge_tipi: belgeTipi,
      p_fis_no: belgeTipi === "okc_fisi" ? fisNo : null,
    });

    if (error) {
      setGonderiliyor(false);
      if (error.message.includes("NEGATIF_STOK_ONAY_GEREKLI")) {
        if (window.confirm("Bu satış bir üründe stoğu eksiye düşürecek. Yine de tamamlamak istiyor musunuz?")) {
          satisiTamamla(true, iskontoOnaylayanId);
        }
        return;
      }
      if (error.message.includes("ISKONTO_ONAY_GEREKLI")) {
        setIskontoOnayBekleniyor({ negatifOnay });
        return;
      }
      if (error.message.includes("STOK_YETERSIZ")) {
        setHata("İşletme politikanız negatif stoğa izin vermiyor — stok yetersiz.");
        return;
      }
      if (error.message.includes("LISANS_ANAHTARI_YETERSIZ")) {
        setHata("Bu dijital ürün için yeterli müsait lisans anahtarı yok — anahtar havuzuna ekleyin.");
        return;
      }
      if (error.message.includes("TAKSIT_LIMITI_ASILDI")) {
        setHata(`Azami taksit sayısı ${maxTaksit}.`);
        return;
      }
      if (error.message.includes("kasa hesabı seçilmeli")) {
        setHata("Her ödeme satırı için bir kasa hesabı seçin.");
        return;
      }
      if (error.message.includes("fiş numarası zorunlu")) {
        setHata("ÖKC fişi için fiş numarası girin.");
        return;
      }
      setHata("Satış tamamlanamadı.");
      return;
    }

    const { data: satis } = await supabase.from("sales").select("sale_no").eq("id", data).single();

    setGonderiliyor(false);
    setBasari({ saleId: data as string, saleNo: satis?.sale_no ?? "—", toplam });
    setKalemler([]);
    setMusteri(null);
    setGenelIskonto("");
    setYuvarlamaAktif(false);
    setBelgeTipi("sonra_kesilecek");
    setFisNo("");
    setOdemeMod("tek");
    setTekYontem("nakit");
    setTekTaksit(1);
    setKarmaSatirlar([]);
    router.refresh();
    aramaRef.current?.focus();
  }

  const belgeGecersiz = belgeTipi === "okc_fisi" && !fisNo.trim();

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
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
                    {u.sale_price != null ? `${u.sale_price.toLocaleString("tr-TR")} TL` : "—"} ·{" "}
                    {u.is_digital ? "🔑 Dijital" : `Stok: ${u.stock_quantity}`}
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
            <>
              <div className="hidden grid-cols-[1fr_60px_80px_70px_80px_24px] gap-2 border-b border-slate-800 px-4 py-2 text-[10px] uppercase tracking-wide text-slate-500 sm:grid">
                <span>Kalem</span>
                <span className="text-right">Adet</span>
                <span className="text-right">Fiyat</span>
                <span className="text-right">İnd.</span>
                <span className="text-right">Tutar</span>
                <span />
              </div>
              <div className="divide-y divide-slate-800/60">
                {kalemler.map((k) => {
                  const satirTutari = Math.max(k.quantity * k.unit_price - (k.discount_amount || 0), 0);
                  return (
                    <div key={k.localId} className="flex flex-wrap items-center gap-2 px-4 py-2.5 sm:grid sm:grid-cols-[1fr_60px_80px_70px_80px_24px]">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-base">{kalemIkon(k.item_type)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-200">{k.name}</p>
                          <p className="text-[11px] text-slate-500">{kalemEtiket(k.item_type)}</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={k.quantity}
                        onChange={(e) => kalemAlanGuncelle(k.localId, "quantity", e.target.value)}
                        className="w-16 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-slate-200 outline-none focus:border-nova-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={k.unit_price}
                        onChange={(e) => kalemAlanGuncelle(k.localId, "unit_price", e.target.value)}
                        className="w-20 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-slate-200 outline-none focus:border-nova-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={k.discount_amount || ""}
                        onChange={(e) => kalemAlanGuncelle(k.localId, "discount_amount", e.target.value)}
                        placeholder="0"
                        className="w-16 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-sm text-amber-300 outline-none placeholder:text-slate-700 focus:border-nova-500"
                      />
                      <span className="w-20 shrink-0 text-right text-sm font-semibold text-slate-200">
                        {paraFmt(satirTutari)}
                      </span>
                      <button
                        type="button"
                        onClick={() => kalemSil(k.localId)}
                        className="shrink-0 text-slate-500 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass h-fit rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400">Müşteri (opsiyonel)</p>
        <div className="mt-1.5">
          <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-medium text-slate-400">Genel İskonto (TL)</p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={genelIskonto}
              onChange={(e) => setGenelIskonto(e.target.value)}
              placeholder="0"
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Yuvarlama</p>
            <button
              type="button"
              onClick={() => setYuvarlamaAktif((a) => !a)}
              className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                yuvarlamaAktif
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {yuvarlamaAktif ? `✓ Küsurat silindi (${paraFmt(yuvarlamaTutari)})` : "Küsuratı Sil"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-slate-400">Ödeme</p>
        {odemeMod === "tek" ? (
          <div className="mt-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(ODEME_YONTEMLERI) as OdemeYontemi[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={k === "acik_hesap" && !musteri}
                  onClick={() => setTekYontem(k)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    tekYontem === k
                      ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {ODEME_YONTEMLERI[k]}
                </button>
              ))}
            </div>
            {tekYontem !== "acik_hesap" && (
              <div className="mt-2">
                <select
                  value={tekHesapId}
                  onChange={(e) => setTekHesapId(e.target.value)}
                  className={`w-full rounded-lg border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-nova-500 ${
                    tekHesapId ? "border-slate-700 text-slate-200" : "border-amber-500/40 text-amber-300"
                  }`}
                >
                  <option value="">Kasa hesabı seçin…</option>
                  {uygunHesaplar(kasaHesaplari, tekYontem).map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tekYontem === "kart" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-slate-500">Taksit</label>
                <select
                  value={tekTaksit}
                  onChange={(e) => setTekTaksit(Number(e.target.value))}
                  className="rounded-lg border border-slate-700 bg-surface px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-nova-500"
                >
                  {Array.from({ length: maxTaksit }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "Tek çekim" : `${n} taksit`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={karmaModunaGec}
              className="mt-2 text-[11px] text-slate-500 hover:text-nova-300"
            >
              🔀 Karma ödeme (nakit + kart)
            </button>
          </div>
        ) : (
          <div className="mt-1.5 space-y-2">
            {karmaSatirlar.map((o) => (
              <div key={o.localId} className="space-y-1.5 rounded-lg border border-slate-800 bg-surface-2 p-2">
                <div className="flex items-center gap-1.5">
                  <select
                    value={o.method}
                    onChange={(e) => karmaYontemDegistir(o.localId, e.target.value as OdemeYontemi)}
                    className="w-24 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-nova-500"
                  >
                    {(Object.keys(ODEME_YONTEMLERI) as OdemeYontemi[]).map((k) => (
                      <option key={k} value={k} disabled={k === "acik_hesap" && !musteri}>
                        {ODEME_YONTEMLERI[k]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={o.amount}
                    onChange={(e) => karmaSatirGuncelle(o.localId, { amount: e.target.value })}
                    placeholder="Tutar"
                    className="flex-1 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-right text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
                  />
                  {o.method === "kart" && (
                    <select
                      value={o.installments}
                      onChange={(e) => karmaSatirGuncelle(o.localId, { installments: Number(e.target.value) })}
                      className="w-16 shrink-0 rounded-lg border border-slate-700 bg-surface px-1.5 py-1.5 text-xs text-slate-200 outline-none focus:border-nova-500"
                    >
                      {Array.from({ length: maxTaksit }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => karmaSatirSil(o.localId)}
                    className="shrink-0 text-slate-500 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
                {o.method !== "acik_hesap" && (
                  <select
                    value={o.accountId}
                    onChange={(e) => karmaSatirGuncelle(o.localId, { accountId: e.target.value })}
                    className={`w-full rounded-lg border bg-surface px-2 py-1.5 text-xs outline-none focus:border-nova-500 ${
                      o.accountId ? "border-slate-700 text-slate-200" : "border-amber-500/40 text-amber-300"
                    }`}
                  >
                    <option value="">Kasa hesabı seçin…</option>
                    {uygunHesaplar(kasaHesaplari, o.method).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between text-[11px]">
              <button type="button" onClick={karmaSatirEkle} className="text-nova-300 hover:text-nova-100">
                + Satır Ekle
              </button>
              <span className={Math.abs(karmaKalan) > 0.01 ? "text-amber-300" : "text-emerald-300"}>
                Kalan: {paraFmt(karmaKalan)} TL
              </span>
            </div>
            <button type="button" onClick={tekModaDon} className="text-[11px] text-slate-500 hover:text-slate-300">
              ← Tek ödeme yöntemine dön
            </button>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium text-slate-400">Belge</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setBelgeTipi("sonra_kesilecek")}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                belgeTipi === "sonra_kesilecek"
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              🕐 Sonra Kesilecek
            </button>
            <button
              type="button"
              onClick={() => setBelgeTipi("okc_fisi")}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                belgeTipi === "okc_fisi"
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              🧾 ÖKC Fişi Kesildi
            </button>
          </div>
          {belgeTipi === "okc_fisi" && (
            <input
              type="text"
              value={fisNo}
              onChange={(e) => setFisNo(e.target.value)}
              placeholder="Fiş no"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          )}
        </div>

        <div className="mt-5 space-y-1 border-t border-slate-800 pt-4 text-xs text-slate-500">
          {satirIskontolari > 0 && (
            <div className="flex justify-between">
              <span>Satır iskontoları</span>
              <span>-{paraFmt(satirIskontolari)} TL</span>
            </div>
          )}
          {genelIskontoSayi > 0 && (
            <div className="flex justify-between">
              <span>Genel iskonto</span>
              <span>-{paraFmt(genelIskontoSayi)} TL</span>
            </div>
          )}
          {yuvarlamaTutari !== 0 && (
            <div className="flex justify-between">
              <span>Yuvarlama</span>
              <span>{paraFmt(yuvarlamaTutari)} TL</span>
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <span className="text-sm text-slate-400">Toplam</span>
          <span className="text-2xl font-bold text-white">{paraFmt(toplam)} TL</span>
        </div>

        {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}
        {basari && (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            ✓{" "}
            <Link href={`/panel/satis/${basari.saleId}`} className="underline hover:text-emerald-100">
              {basari.saleNo}
            </Link>{" "}
            tamamlandı — {paraFmt(basari.toplam)} TL
          </p>
        )}

        <button
          type="button"
          onClick={() => satisiTamamla()}
          disabled={
            !kalemler.length ||
            gonderiliyor ||
            (odemeMod === "karma" && (Math.abs(karmaKalan) > 0.01 || karmaSatirlar.length === 0)) ||
            (acikHesapSeciliMi && !musteri) ||
            hesapEksikMi ||
            belgeGecersiz
          }
          className="mt-4 w-full rounded-lg bg-nova-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {gonderiliyor ? "Kaydediliyor…" : "Satışı Tamamla"}
        </button>
      </div>

      {iskontoOnayBekleniyor && (
        <YoneticiOnayModal
          mesaj="Bu satıştaki iskonto oranı kasiyer limitinin üzerinde. Devam etmek için bir yönetici onayı gerekiyor."
          onOnay={(userId) => {
            const negatifOnay = iskontoOnayBekleniyor.negatifOnay;
            setIskontoOnayBekleniyor(null);
            satisiTamamla(negatifOnay, userId);
          }}
          onVazgec={() => {
            setIskontoOnayBekleniyor(null);
            setGonderiliyor(false);
          }}
        />
      )}
    </div>
  );
}
