"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Politika = "uyarili" | "onayli" | "yasak";

const SECENEKLER: { deger: Politika; baslik: string; aciklama: string }[] = [
  {
    deger: "uyarili",
    baslik: "Uyarılı",
    aciklama: "Stok eksiye düşebilir; işlem tamamlanır, ekranda uyarı gösterilir.",
  },
  {
    deger: "onayli",
    baslik: "Onaylı",
    aciklama: "Stok eksiye düşecekse işlem öncesi açık onay istenir.",
  },
  {
    deger: "yasak",
    baslik: "Yasak",
    aciklama: "Stok yetersizse işlem tamamen engellenir.",
  },
];

type Props = {
  tenantId: string;
  yetkili: boolean;
  mevcutPolitika: Politika;
};

export function StokPolitikasi({ tenantId, yetkili, mevcutPolitika }: Props) {
  const [politika, setPolitika] = useState<Politika>(mevcutPolitika);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function sec(yeni: Politika) {
    if (yeni === politika || !yetkili) return;
    setKaydediliyor(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tenants")
      .update({ negative_stock_policy: yeni })
      .eq("id", tenantId);

    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "negatif_stok_politikasi_degistirildi",
        p_entity: "tenant",
        p_entity_id: tenantId,
        p_old: { negative_stock_policy: politika },
        p_new: { negative_stock_policy: yeni },
      });
      setPolitika(yeni);
    }
    setKaydediliyor(false);
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Negatif Stok Politikası</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Bir işlem (servis parça onayı, manuel düzeltme, sayım) stoğu eksiye
        düşürmeye çalışırsa ne olsun?
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {SECENEKLER.map((s) => (
          <button
            key={s.deger}
            type="button"
            disabled={!yetkili || kaydediliyor}
            onClick={() => sec(s.deger)}
            className={`rounded-lg border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed ${
              politika === s.deger
                ? "border-nova-500/60 bg-nova-500/10"
                : "border-slate-800 bg-surface hover:border-slate-600"
            }`}
          >
            <p
              className={`text-sm font-medium ${politika === s.deger ? "text-nova-200" : "text-slate-200"}`}
            >
              {politika === s.deger ? "✓ " : ""}
              {s.baslik}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {s.aciklama}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
