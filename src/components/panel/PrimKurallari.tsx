"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Kural = {
  role: "satis" | "servis";
  basis: string;
  rate_percent: number | null;
  fixed_amount: number | null;
  is_active: boolean;
};

type Props = {
  tenantId: string;
  yetkili: boolean;
  satisKurali: Kural | null;
  servisKurali: Kural | null;
};

export function PrimKurallari({ tenantId, yetkili, satisKurali, servisKurali }: Props) {
  const [satis, setSatis] = useState<Kural>(
    satisKurali ?? { role: "satis", basis: "ciro", rate_percent: null, fixed_amount: null, is_active: true }
  );
  const [servis, setServis] = useState<Kural>(
    servisKurali ?? { role: "servis", basis: "servis_adedi", rate_percent: null, fixed_amount: null, is_active: true }
  );
  const [kaydediliyor, setKaydediliyor] = useState<"satis" | "servis" | null>(null);
  const [sonuc, setSonuc] = useState<string | null>(null);

  const alanSinifi =
    "w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-nova-500";

  async function kaydet(rol: "satis" | "servis") {
    const kural = rol === "satis" ? satis : servis;
    setKaydediliyor(rol);
    setSonuc(null);
    const supabase = createClient();
    const { error } = await supabase.from("commission_rules").upsert(
      {
        tenant_id: tenantId,
        role: kural.role,
        basis: kural.basis,
        rate_percent: kural.rate_percent,
        fixed_amount: kural.fixed_amount,
        is_active: kural.is_active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,role" }
    );
    setKaydediliyor(null);
    setSonuc(error ? "Kaydedilemedi." : "Kaydedildi ✓");
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Prim Kuralları</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Raporlar &gt; Personel/Prim'de seçilen dönem için canlı hesaplanır — ayrı bir prim kaydı
        tutulmaz, bordroya veri sağlar.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-surface p-3.5">
          <p className="text-xs font-medium text-slate-300">Satış Primi</p>
          <div className="mt-2 space-y-2">
            <select
              value={satis.basis}
              onChange={(e) => setSatis((s) => ({ ...s, basis: e.target.value }))}
              disabled={!yetkili}
              className={alanSinifi}
            >
              <option value="ciro">Ciro Bazlı</option>
              <option value="karlilik">Kârlılık Bazlı</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={satis.rate_percent ?? ""}
                onChange={(e) => setSatis((s) => ({ ...s, rate_percent: e.target.value ? Number(e.target.value) : null }))}
                disabled={!yetkili}
                placeholder="Oran"
                className={alanSinifi}
              />
              <span className="shrink-0 text-xs text-slate-500">%</span>
            </div>
            {yetkili && (
              <button
                type="button"
                onClick={() => kaydet("satis")}
                disabled={kaydediliyor !== null}
                className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {kaydediliyor === "satis" ? "Kaydediliyor…" : "Kaydet"}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-surface p-3.5">
          <p className="text-xs font-medium text-slate-300">Teknisyen (Servis) Primi</p>
          <div className="mt-2 space-y-2">
            <select
              value={servis.basis}
              onChange={(e) => setServis((s) => ({ ...s, basis: e.target.value }))}
              disabled={!yetkili}
              className={alanSinifi}
            >
              <option value="servis_adedi">Kapanan Servis Başına Sabit Tutar</option>
              <option value="iscilik_cirosu">İşçilik Cirosu Bazlı Oran</option>
            </select>
            {servis.basis === "servis_adedi" ? (
              <input
                type="number"
                min={0}
                step="0.01"
                value={servis.fixed_amount ?? ""}
                onChange={(e) => setServis((s) => ({ ...s, fixed_amount: e.target.value ? Number(e.target.value) : null }))}
                disabled={!yetkili}
                placeholder="Servis başına ₺"
                className={alanSinifi}
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={servis.rate_percent ?? ""}
                  onChange={(e) => setServis((s) => ({ ...s, rate_percent: e.target.value ? Number(e.target.value) : null }))}
                  disabled={!yetkili}
                  placeholder="Oran"
                  className={alanSinifi}
                />
                <span className="shrink-0 text-xs text-slate-500">%</span>
              </div>
            )}
            {yetkili && (
              <button
                type="button"
                onClick={() => kaydet("servis")}
                disabled={kaydediliyor !== null}
                className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {kaydediliyor === "servis" ? "Kaydediliyor…" : "Kaydet"}
              </button>
            )}
          </div>
        </div>
      </div>

      {sonuc && <p className="mt-3 text-xs text-emerald-300">{sonuc}</p>}
      <p className="mt-3 text-[11px] text-slate-600">
        İşçilik cirosu, tamamlanan bir servisin toplam tutarından kullanılan parçaların satış
        bedeli düşülerek yaklaşık hesaplanır.
      </p>
    </div>
  );
}
