"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { UrunEkleSatiri, type SecilenKalem } from "./UrunEkleSatiri";

type Musteri = { id: string; name: string; phone: string | null };
type Recete = { id: string; name: string; labor_cost: number };

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function ToplamaEmriFormu({ tenantId, receteler }: { tenantId: string; receteler: Recete[] }) {
  const router = useRouter();
  const [mod, setMod] = useState<"recete" | "serbest">(receteler.length > 0 ? "recete" : "serbest");
  const [receteId, setReceteId] = useState(receteler[0]?.id ?? "");
  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [kalemler, setKalemler] = useState<SecilenKalem[]>([]);
  const [notlar, setNotlar] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  function kalemEkle(kalem: SecilenKalem) {
    setKalemler((k) => [...k, kalem]);
  }

  async function olustur() {
    if (mod === "recete" && !receteId) {
      setHata("Bir reçete seçin.");
      return;
    }
    if (mod === "serbest" && kalemler.length === 0) {
      setHata("En az bir parça ekleyin.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("toplama_emri_olustur", {
      p_recipe_id: mod === "recete" ? receteId : null,
      p_customer_id: musteri?.id ?? null,
      p_kalemler: mod === "serbest" ? kalemler.map((k) => ({ product_id: k.productId, quantity: k.quantity })) : null,
      p_notlar: notlar.trim() || null,
    });
    setYukleniyor(false);
    if (error || !data) {
      setHata("Toplama emri oluşturulamadı.");
      return;
    }
    router.push(`/panel/pc-toplama/${data}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {receteler.length > 0 && (
          <button
            type="button"
            onClick={() => setMod("recete")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              mod === "recete" ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-400"
            }`}
          >
            Reçeteden
          </button>
        )}
        <button
          type="button"
          onClick={() => setMod("serbest")}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            mod === "serbest" ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-400"
          }`}
        >
          Serbest (Müşteriye Özel)
        </button>
      </div>

      {mod === "recete" ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Reçete</label>
          <select value={receteId} onChange={(e) => setReceteId(e.target.value)} className={alanSinifi}>
            {receteler.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
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
                    onClick={() => setKalemler((ks) => ks.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Müşteri (opsiyonel)</label>
        <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Notlar</label>
        <textarea rows={2} value={notlar} onChange={(e) => setNotlar(e.target.value)} className={`${alanSinifi} resize-none`} />
      </div>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={olustur}
          disabled={yukleniyor}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor ? "Oluşturuluyor…" : "Toplama Emri Oluştur"}
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
