"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tenantId: string;
  yetkili: boolean;
  mevcutLimit: number;
};

export function TaksitAyari({ tenantId, yetkili, mevcutLimit }: Props) {
  const [deger, setDeger] = useState(mevcutLimit.toString());
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);

  async function kaydet() {
    const sayi = Number(deger);
    if (!Number.isInteger(sayi) || sayi < 1) return;
    setKaydediliyor(true);
    setKaydedildi(false);
    const supabase = createClient();
    const { error } = await supabase.from("tenants").update({ max_installments: sayi }).eq("id", tenantId);
    setKaydediliyor(false);
    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "taksit_limiti_degistirildi",
        p_entity: "tenant",
        p_entity_id: tenantId,
        p_new: { max_installments: sayi },
      });
      setKaydedildi(true);
    }
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Taksit Limiti</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Kart ödemelerinde satış ekranında seçilebilecek azami taksit sayısı.
      </p>

      {yetkili ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            step="1"
            min="1"
            value={deger}
            onChange={(e) => {
              setDeger(e.target.value);
              setKaydedildi(false);
            }}
            className="w-24 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
          />
          <button
            onClick={kaydet}
            disabled={kaydediliyor || Number(deger) === mevcutLimit}
            className="rounded-lg bg-nova-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {kaydedildi && <span className="text-xs text-emerald-300">✓ Kaydedildi</span>}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-300">{mevcutLimit} taksit</p>
      )}
    </div>
  );
}
