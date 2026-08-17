"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tenantId: string;
  yetkili: boolean;
  mevcutGarantiGun: number;
  mevcutBeklemeGun: number;
};

export function ServisAyarlari({ tenantId, yetkili, mevcutGarantiGun, mevcutBeklemeGun }: Props) {
  const [garantiGun, setGarantiGun] = useState(mevcutGarantiGun.toString());
  const [beklemeGun, setBeklemeGun] = useState(mevcutBeklemeGun.toString());
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);

  const degisti = Number(garantiGun) !== mevcutGarantiGun || Number(beklemeGun) !== mevcutBeklemeGun;

  async function kaydet() {
    const g = Number(garantiGun);
    const b = Number(beklemeGun);
    if (!Number.isInteger(g) || g < 0 || !Number.isInteger(b) || b < 1) return;
    setKaydediliyor(true);
    setKaydedildi(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("tenants")
      .update({ default_warranty_days: g, hazir_bekleme_gun: b })
      .eq("id", tenantId);
    setKaydediliyor(false);
    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "servis_ayarlari_degistirildi",
        p_entity: "tenant",
        p_entity_id: tenantId,
        p_new: { default_warranty_days: g, hazir_bekleme_gun: b },
      });
      setKaydedildi(true);
    }
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Servis Ayarları</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Teslimde önerilecek varsayılan garanti süresi ve cihazın "hazır" durumunda kaç gün
        beklenirse otomatik "Teslim Alınmadı" işaretleneceği.
      </p>

      {yetkili ? (
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] text-slate-400">Varsayılan garanti (gün)</label>
            <input
              type="number"
              min="0"
              value={garantiGun}
              onChange={(e) => {
                setGarantiGun(e.target.value);
                setKaydedildi(false);
              }}
              className="w-28 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] text-slate-400">Bekleme süresi (gün)</label>
            <input
              type="number"
              min="1"
              value={beklemeGun}
              onChange={(e) => {
                setBeklemeGun(e.target.value);
                setKaydedildi(false);
              }}
              className="w-28 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
          </div>
          <button
            onClick={kaydet}
            disabled={kaydediliyor || !degisti}
            className="rounded-lg bg-nova-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {kaydedildi && <span className="text-xs text-emerald-300">✓ Kaydedildi</span>}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-300">
          {mevcutGarantiGun} gün garanti · {mevcutBeklemeGun} gün bekleme süresi
        </p>
      )}
    </div>
  );
}
