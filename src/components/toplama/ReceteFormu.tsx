"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UrunEkleSatiri, type SecilenKalem } from "./UrunEkleSatiri";

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function ReceteFormu() {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [iscilik, setIscilik] = useState("0");
  const [kalemler, setKalemler] = useState<SecilenKalem[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  function kalemEkle(kalem: SecilenKalem) {
    setKalemler((k) => [...k, kalem]);
  }

  function kalemSil(i: number) {
    setKalemler((k) => k.filter((_, idx) => idx !== i));
  }

  async function kaydet() {
    if (!ad.trim()) {
      setHata("Reçete adı gerekli.");
      return;
    }
    if (kalemler.length === 0) {
      setHata("En az bir parça ekleyin.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("recete_olustur", {
      p_name: ad.trim(),
      p_description: aciklama.trim() || null,
      p_labor_cost: Number(iscilik) || 0,
      p_kalemler: kalemler.map((k) => ({ product_id: k.productId, quantity: k.quantity })),
    });
    setYukleniyor(false);
    if (error) {
      setHata("Reçete kaydedilemedi.");
      return;
    }
    router.push("/panel/pc-toplama");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Reçete adı *</label>
        <input
          type="text"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Örn: Oyun PC'si — Orta Segment"
          className={alanSinifi}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Açıklama</label>
        <textarea
          rows={2}
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          className={`${alanSinifi} resize-none`}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Montaj işçiliği (TL)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={iscilik}
          onChange={(e) => setIscilik(e.target.value)}
          className={alanSinifi}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Parçalar</label>
        <UrunEkleSatiri onEkle={kalemEkle} />
        {kalemler.length > 0 && (
          <div className="mt-3 divide-y divide-slate-800/60 rounded-lg border border-slate-800">
            {kalemler.map((k, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-sm text-slate-200">
                  {k.productName} <span className="text-slate-500">× {k.quantity}</span>
                </span>
                <button
                  type="button"
                  onClick={() => kalemSil(i)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={kaydet}
          disabled={yukleniyor}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor ? "Kaydediliyor…" : "Reçeteyi Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
