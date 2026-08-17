"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  saleId: string;
  yetkili: boolean;
  musteriTipi: string | null;
  musteriVkn: string | null;
};

export function SatisBelgesi({ saleId, yetkili, musteriTipi, musteriVkn }: Props) {
  const router = useRouter();
  const [fisNo, setFisNo] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const eBelgeUygun = musteriTipi === "corporate" && !!musteriVkn?.trim();

  async function fisKes() {
    if (!fisNo.trim()) {
      setHata("Fiş numarası girin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("satis_belgesini_kes", {
      p_sale_id: saleId,
      p_fis_no: fisNo,
    });
    setKaydediliyor(false);
    if (error) {
      setHata("Belge kaydedilemedi.");
      return;
    }
    router.refresh();
  }

  async function eBelgeKes(belgeTipi: "e_fatura" | "e_arsiv_fatura") {
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("satis_e_belge_kes", {
      p_sale_id: saleId,
      p_belge_tipi: belgeTipi,
    });
    setKaydediliyor(false);
    if (error) {
      setHata(
        error.message.includes("VKN")
          ? "e-Fatura için müşterinin VKN'si kayıtlı olmalı."
          : "Belge kesilemedi."
      );
      return;
    }
    router.refresh();
  }

  if (!yetkili) return null;

  return (
    <div className="glass rounded-xl border border-amber-500/25 p-4">
      <p className="text-sm font-medium text-amber-200">🕐 Belge sonra kesilecek</p>
      <p className="mt-0.5 text-xs text-slate-500">
        ÖKC&apos;den fiş kesildiğinde numarasını buraya girin{eBelgeUygun ? " ya da e-Belge kesin" : ""}.
      </p>
      <div className="mt-2.5 flex gap-2">
        <input
          type="text"
          value={fisNo}
          onChange={(e) => setFisNo(e.target.value)}
          placeholder="Fiş no"
          className="flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        <button
          onClick={fisKes}
          disabled={kaydediliyor}
          className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Belgeyi Kes"}
        </button>
      </div>
      {eBelgeUygun && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
          <span className="text-[11px] text-slate-500">Kurumsal müşteri — e-Belge:</span>
          <button
            onClick={() => eBelgeKes("e_fatura")}
            disabled={kaydediliyor}
            className="rounded-lg border border-purple-500/40 px-3 py-1.5 text-[11px] font-medium text-purple-300 transition hover:bg-purple-500/10 disabled:opacity-60"
          >
            🧾 e-Fatura Kes
          </button>
          <button
            onClick={() => eBelgeKes("e_arsiv_fatura")}
            disabled={kaydediliyor}
            className="rounded-lg border border-purple-500/40 px-3 py-1.5 text-[11px] font-medium text-purple-300 transition hover:bg-purple-500/10 disabled:opacity-60"
          >
            🧾 e-Arşiv Fatura Kes
          </button>
        </div>
      )}
      {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
    </div>
  );
}
