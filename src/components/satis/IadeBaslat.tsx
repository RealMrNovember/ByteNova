"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  saleItemId: string;
  urunAdi: string;
  iadeEdilebilirMiktar: number;
  yetkili: boolean;
};

export function IadeBaslat({ saleItemId, urunAdi, iadeEdilebilirMiktar, yetkili }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [miktar, setMiktar] = useState(iadeEdilebilirMiktar.toString());
  const [neden, setNeden] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  if (!yetkili || iadeEdilebilirMiktar <= 0) return null;

  async function baslat() {
    const sayi = Number(miktar);
    if (!sayi || sayi <= 0 || sayi > iadeEdilebilirMiktar) {
      setHata(`1–${iadeEdilebilirMiktar} arasında bir miktar girin.`);
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("iade_baslat", {
      p_sale_item_id: saleItemId,
      p_miktar: sayi,
      p_neden: neden.trim() || null,
    });
    setKaydediliyor(false);
    if (error) {
      setHata("İade başlatılamadı.");
      return;
    }
    setAcik(false);
    setNeden("");
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-nova-500/50 hover:text-white"
      >
        ↩️ İade Al
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-slate-700 bg-surface-2 p-3">
      <p className="text-[11px] text-slate-400">
        {urunAdi} — iade edilebilir: {iadeEdilebilirMiktar}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          step="1"
          min="1"
          max={iadeEdilebilirMiktar}
          value={miktar}
          onChange={(e) => setMiktar(e.target.value)}
          className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-nova-500"
        />
        <input
          type="text"
          value={neden}
          onChange={(e) => setNeden(e.target.value)}
          placeholder="Neden (opsiyonel)"
          className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
      </div>
      {hata && <p className="mt-2 text-[11px] text-red-300">{hata}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={baslat}
          disabled={kaydediliyor}
          className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "İadeyi Başlat"}
        </button>
        <button
          onClick={() => setAcik(false)}
          className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
