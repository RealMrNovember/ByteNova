"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";
import { BILESEN_TIPLERI, bilesenIkon, type BilesenTipi } from "@/lib/toplama";

export type YapilandiricaKalemi = {
  clientId: string;
  componentType: BilesenTipi;
  productId: string | null;
  name: string;
  brand: string | null;
  price: number;
  quantity: number;
  stockQuantity: number | null;
};

type UrunSonucu = {
  id: string;
  name: string;
  brand: string | null;
  sale_price: number | null;
  stock_quantity: number;
};

type Muadil = { id: string; name: string; stock_quantity: number };

type Props = {
  mod: "stok" | "genel";
  kalemler: YapilandiricaKalemi[];
  onKalemlerDegisti: (kalemler: YapilandiricaKalemi[]) => void;
  iscilik?: number;
};

function yeniId() {
  return `k${Math.random().toString(36).slice(2)}${performance.now().toString(36)}`;
}

export function PcYapilandirici({ mod, kalemler, onKalemlerDegisti, iscilik = 0 }: Props) {
  const [aktifTip, setAktifTip] = useState<BilesenTipi>("islemci");
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<UrunSonucu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [uzerindeSurukleniyor, setUzerindeSurukleniyor] = useState(false);
  const [muadilAcikId, setMuadilAcikId] = useState<string | null>(null);
  const [muadiller, setMuadiller] = useState<Muadil[]>([]);

  // Genel mod — hızlı ekle formu
  const [genelAd, setGenelAd] = useState("");
  const [genelMarka, setGenelMarka] = useState("");
  const [genelFiyat, setGenelFiyat] = useState("");

  useEffect(() => {
    if (mod !== "stok") return;
    setYukleniyor(true);
    const t = setTimeout(async () => {
      const supabase = createClient();
      let sorgu = supabase
        .from("products")
        .select("id, name, brand, sale_price, stock_quantity")
        .eq("component_type", aktifTip)
        .eq("is_active", true)
        .eq("is_digital", false);
      if (arama.trim().length >= 2) {
        sorgu = sorgu.or(`name.ilike.%${arama.trim()}%,sku.ilike.%${arama.trim()}%`);
      }
      const { data } = await sorgu.order("stock_quantity", { ascending: false }).limit(24);
      setSonuclar(data ?? []);
      setYukleniyor(false);
    }, 250);
    return () => clearTimeout(t);
  }, [mod, aktifTip, arama]);

  async function muadilGetir(urun: UrunSonucu) {
    if (muadilAcikId === urun.id) {
      setMuadilAcikId(null);
      return;
    }
    setMuadilAcikId(urun.id);
    const supabase = createClient();
    const { data: iliskiler } = await supabase
      .from("product_compatibilities")
      .select("product_id, compatible_product_id")
      .or(`product_id.eq.${urun.id},compatible_product_id.eq.${urun.id}`);
    const digerIdler = (iliskiler ?? []).map((r) => (r.product_id === urun.id ? r.compatible_product_id : r.product_id));
    if (!digerIdler.length) {
      setMuadiller([]);
      return;
    }
    const { data: urunler } = await supabase
      .from("products")
      .select("id, name, stock_quantity")
      .in("id", digerIdler)
      .eq("is_active", true);
    setMuadiller(urunler ?? []);
  }

  function urunEkle(u: UrunSonucu) {
    const mevcut = kalemler.find((k) => k.productId === u.id);
    if (mevcut) {
      onKalemlerDegisti(kalemler.map((k) => (k.clientId === mevcut.clientId ? { ...k, quantity: k.quantity + 1 } : k)));
      return;
    }
    onKalemlerDegisti([
      ...kalemler,
      {
        clientId: yeniId(),
        componentType: aktifTip,
        productId: u.id,
        name: u.name,
        brand: u.brand,
        price: u.sale_price ?? 0,
        quantity: 1,
        stockQuantity: u.stock_quantity,
      },
    ]);
  }

  function genelEkle() {
    if (!genelAd.trim()) return;
    onKalemlerDegisti([
      ...kalemler,
      {
        clientId: yeniId(),
        componentType: aktifTip,
        productId: null,
        name: genelAd.trim(),
        brand: genelMarka.trim() || null,
        price: genelFiyat ? Number(genelFiyat) : 0,
        quantity: 1,
        stockQuantity: null,
      },
    ]);
    setGenelAd("");
    setGenelMarka("");
    setGenelFiyat("");
  }

  function miktarDegistir(clientId: string, delta: number) {
    onKalemlerDegisti(
      kalemler
        .map((k) => (k.clientId === clientId ? { ...k, quantity: Math.max(1, k.quantity + delta) } : k))
        .filter((k) => k.quantity > 0)
    );
  }

  function kalemSil(clientId: string) {
    onKalemlerDegisti(kalemler.filter((k) => k.clientId !== clientId));
  }

  function dropOldu(e: React.DragEvent) {
    e.preventDefault();
    setUzerindeSurukleniyor(false);
    const veri = e.dataTransfer.getData("application/json");
    if (!veri) return;
    try {
      const { productId } = JSON.parse(veri);
      const u = sonuclar.find((s) => s.id === productId);
      if (u) urunEkle(u);
    } catch {
      // yoksay
    }
  }

  const parcaToplami = kalemler.reduce((t, k) => t + k.price * k.quantity, 0);
  const genelToplam = parcaToplami + iscilik;

  const kategoriBazliKalemler = BILESEN_TIPLERI.map((b) => ({
    tip: b,
    kalemler: kalemler.filter((k) => k.componentType === b.deger),
  })).filter((g) => g.kalemler.length > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        {/* Kategori sekmeleri */}
        <div className="flex flex-wrap gap-1.5">
          {BILESEN_TIPLERI.map((b) => (
            <button
              key={b.deger}
              type="button"
              onClick={() => setAktifTip(b.deger)}
              className="relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {aktifTip === b.deger && (
                <motion.span
                  layoutId="aktif-bilesen-sekmesi"
                  className="absolute inset-0 rounded-lg bg-nova-500/15 ring-1 ring-nova-500/40"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span
                className={`relative z-10 ${aktifTip === b.deger ? "text-nova-300" : "text-slate-400 hover:text-slate-200"}`}
              >
                {b.ikon} {b.etiket}
              </span>
            </button>
          ))}
        </div>

        {mod === "stok" ? (
          <div className="mt-3">
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder={`🔍 ${BILESEN_TIPLERI.find((b) => b.deger === aktifTip)?.etiket} ara…`}
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {yukleniyor ? (
                <p className="col-span-2 py-8 text-center text-xs text-slate-600">Yükleniyor…</p>
              ) : !sonuclar.length ? (
                <p className="col-span-2 py-8 text-center text-xs text-slate-600">
                  Bu kategoride ürün bulunamadı. Ürün formundan "PC Bileşen Tipi" etiketleyin.
                </p>
              ) : (
                sonuclar.map((u) => (
                  <motion.div
                    key={u.id}
                    layout
                    draggable
                    onDragStart={(e) => {
                      (e as unknown as React.DragEvent).dataTransfer?.setData(
                        "application/json",
                        JSON.stringify({ productId: u.id })
                      );
                    }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-grab rounded-lg border border-slate-800 bg-surface p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">{u.name}</p>
                        {u.brand && <p className="text-[11px] text-slate-500">{u.brand}</p>}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.stock_quantity > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {u.stock_quantity > 0 ? `${u.stock_quantity} stok` : "Stok yok"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">
                        {u.sale_price != null ? paraFormatla(u.sale_price) : "—"}
                      </span>
                      <div className="flex items-center gap-2">
                        {u.stock_quantity <= 0 && (
                          <button
                            type="button"
                            onClick={() => muadilGetir(u)}
                            className="text-[11px] font-medium text-amber-300 hover:text-amber-200"
                          >
                            🔄 Muadil
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => urunEkle(u)}
                          className="rounded-lg bg-nova-500 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition hover:bg-nova-400"
                        >
                          + Ekle
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {muadilAcikId === u.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {!muadiller.length ? (
                            <p className="mt-2 text-[11px] text-slate-600">Tanımlı muadil yok.</p>
                          ) : (
                            <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                              {muadiller.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  disabled={m.stock_quantity <= 0}
                                  onClick={() =>
                                    urunEkle({ id: m.id, name: m.name, brand: null, sale_price: null, stock_quantity: m.stock_quantity })
                                  }
                                  className="flex w-full items-center justify-between rounded-md px-1.5 py-1 text-left text-[11px] text-slate-300 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <span>{m.name}</span>
                                  <span className={m.stock_quantity > 0 ? "text-emerald-300" : "text-slate-600"}>
                                    {m.stock_quantity} stok
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-800 bg-surface p-3.5">
            <p className="text-xs font-medium text-slate-300">
              {BILESEN_TIPLERI.find((b) => b.deger === aktifTip)?.ikon}{" "}
              {BILESEN_TIPLERI.find((b) => b.deger === aktifTip)?.etiket} ekle
            </p>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Stoğunuzda olmayan bir ürünü de plana dahil edebilirsiniz — tahmini fiyat girin.
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={genelAd}
                onChange={(e) => setGenelAd(e.target.value)}
                placeholder="Ürün / model adı"
                className="rounded-lg border border-slate-700 bg-surface-2 px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500 sm:col-span-1"
              />
              <input
                type="text"
                value={genelMarka}
                onChange={(e) => setGenelMarka(e.target.value)}
                placeholder="Marka (opsiyonel)"
                className="rounded-lg border border-slate-700 bg-surface-2 px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={genelFiyat}
                onChange={(e) => setGenelFiyat(e.target.value)}
                placeholder="Tahmini fiyat ₺"
                className="rounded-lg border border-slate-700 bg-surface-2 px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              />
            </div>
            <button
              type="button"
              onClick={genelEkle}
              disabled={!genelAd.trim()}
              className="mt-2.5 rounded-lg bg-nova-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Plana Ekle
            </button>
          </div>
        )}
      </div>

      {/* Yapılandırma sepeti */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setUzerindeSurukleniyor(true);
        }}
        onDragLeave={() => setUzerindeSurukleniyor(false)}
        onDrop={dropOldu}
        className={`glass sticky top-4 flex h-fit max-h-[80vh] flex-col overflow-hidden rounded-xl border transition-colors ${
          uzerindeSurukleniyor ? "border-nova-500/60 bg-nova-500/5" : "border-slate-800"
        }`}
      >
        <div className="border-b border-slate-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">🧩 Yapılandırmanız</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {mod === "stok" ? "Kartları buraya sürükleyin veya + Ekle'ye tıklayın." : "Kalemler burada birikir."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {!kalemler.length ? (
            <p className="py-10 text-center text-xs text-slate-600">Henüz parça eklenmedi.</p>
          ) : (
            <div className="space-y-3">
              {kategoriBazliKalemler.map((grup) => (
                <div key={grup.tip.deger}>
                  <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {grup.tip.ikon} {grup.tip.etiket}
                  </p>
                  <div className="mt-1 space-y-1.5">
                    <AnimatePresence initial={false}>
                      {grup.kalemler.map((k) => (
                        <motion.div
                          key={k.clientId}
                          layout
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.95 }}
                          transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                          className="rounded-lg border border-slate-800 bg-surface px-2.5 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-xs text-slate-200">{k.name}</p>
                            <button
                              type="button"
                              onClick={() => kalemSil(k.clientId)}
                              className="shrink-0 text-slate-600 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => miktarDegistir(k.clientId, -1)}
                                className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 text-xs text-slate-400 hover:border-slate-500"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-xs text-slate-300">{k.quantity}</span>
                              <button
                                type="button"
                                onClick={() => miktarDegistir(k.clientId, 1)}
                                className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 text-xs text-slate-400 hover:border-slate-500"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-semibold text-slate-200">
                              {paraFormatla(k.price * k.quantity)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 bg-surface-2 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Parça Toplamı</span>
            <motion.span key={parcaToplami} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
              {paraFormatla(parcaToplami)}
            </motion.span>
          </div>
          {iscilik > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>İşçilik</span>
              <span>{paraFormatla(iscilik)}</span>
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-800 pt-1.5">
            <span className="text-sm font-medium text-slate-200">Genel Toplam</span>
            <motion.span
              key={genelToplam}
              initial={{ scale: 1.08, color: "#8b5cf6" }}
              animate={{ scale: 1, color: "#e9d5ff" }}
              className="text-lg font-bold text-nova-300"
            >
              {paraFormatla(genelToplam)}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}
