"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  productId: string;
  mevcutStok: number;
  yetkili: boolean;
};

export function StokDuzeltme({ productId, mevcutStok, yetkili }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [yeniMiktar, setYeniMiktar] = useState(mevcutStok.toString());
  const [neden, setNeden] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [uyari, setUyari] = useState<string | null>(null);

  if (!yetkili) return null;

  async function kaydet(negatifOnay = false) {
    const hedef = Number(yeniMiktar);
    if (Number.isNaN(hedef)) {
      setHata("Geçerli bir miktar girin.");
      return;
    }
    const degisim = hedef - mevcutStok;
    if (degisim === 0) {
      setAcik(false);
      return;
    }
    if (!neden.trim()) {
      setHata("Düzeltme sebebi zorunlu (audit için).");
      return;
    }

    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("stok_hareketi_ekle", {
      p_product_id: productId,
      p_degisim: degisim,
      p_tip: "adjustment",
      p_neden: neden.trim(),
      p_negatif_onay: negatifOnay,
    });

    if (error) {
      setYukleniyor(false);
      if (error.message.includes("NEGATIF_STOK_ONAY_GEREKLI")) {
        if (
          window.confirm(
            `Bu düzeltme stoğu eksiye düşürecek (${mevcutStok} → ${hedef}). Onaylıyor musunuz?`
          )
        ) {
          kaydet(true);
        }
        return;
      }
      setHata(
        error.message.includes("STOK_YETERSIZ")
          ? "İşletme politikanız negatif stoğa izin vermiyor."
          : "Düzeltme kaydedilemedi."
      );
      return;
    }
    setYukleniyor(false);

    await supabase.rpc("audit_ekle", {
      p_action: "stok_duzeltildi",
      p_entity: "product",
      p_entity_id: productId,
      p_old: { stock_quantity: mevcutStok },
      p_new: { stock_quantity: hedef, reason: neden.trim() },
    });

    if (typeof data === "number" && data < 0) {
      setUyari(`⚠️ Not: bu üründe stok artık eksi (${data}).`);
    }
    setAcik(false);
    setNeden("");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAcik((a) => !a)}
        className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
      >
        ✏️ Stok Düzelt
      </button>

      {!acik && uyari && (
        <p className="absolute right-0 top-9 z-30 w-56 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 shadow-xl">
          {uyari}
        </p>
      )}

      {acik && (
        <div className="glass absolute right-0 top-9 z-30 w-72 rounded-xl p-4 shadow-xl">
          <p className="text-xs font-medium text-slate-300">Stok Düzelt</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Mevcut: {mevcutStok}</p>
          <input
            type="number"
            step="0.01"
            autoFocus
            value={yeniMiktar}
            onChange={(e) => setYeniMiktar(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
            placeholder="Yeni miktar"
          />
          <input
            type="text"
            value={neden}
            onChange={(e) => setNeden(e.target.value)}
            placeholder="Sebep (örn: sayım farkı, hasar)"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          {hata && <p className="mt-2 text-[11px] text-red-300">{hata}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => kaydet()}
              disabled={yukleniyor}
              className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
            >
              {yukleniyor ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              onClick={() => setAcik(false)}
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
