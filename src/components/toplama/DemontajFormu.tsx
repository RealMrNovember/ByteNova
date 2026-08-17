"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UrunEkleSatiri, type SecilenKalem } from "./UrunEkleSatiri";

type TamamlanmisEmir = { id: string; order_no: string; product_id: string | null };

export function DemontajFormu({ tamamlanmisEmirler }: { tamamlanmisEmirler: TamamlanmisEmir[] }) {
  const router = useRouter();
  const [mod, setMod] = useState<"emir" | "serbest">(tamamlanmisEmirler.length > 0 ? "emir" : "serbest");
  const [emirId, setEmirId] = useState(tamamlanmisEmirler[0]?.id ?? "");
  const [kalemler, setKalemler] = useState<SecilenKalem[]>([]);
  const [notlar, setNotlar] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basari, setBasari] = useState(false);

  async function demonteEt() {
    if (mod === "emir" && !emirId) {
      setHata("Bir toplama emri seçin.");
      return;
    }
    if (mod === "serbest" && kalemler.length === 0) {
      setHata("En az bir parça ekleyin.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("demontaj_yap", {
      p_source_assembly_order_id: mod === "emir" ? emirId : null,
      p_kalemler:
        mod === "serbest"
          ? kalemler.map((k) => ({ product_id: k.productId, quantity: k.quantity, serial_no: null, estimated_value: null }))
          : null,
      p_notlar: notlar.trim() || null,
    });
    setYukleniyor(false);
    if (error) {
      setHata("Demontaj yapılamadı.");
      return;
    }
    setBasari(true);
    setKalemler([]);
    router.refresh();
  }

  const alanSinifi =
    "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-nova-500";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tamamlanmisEmirler.length > 0 && (
          <button
            type="button"
            onClick={() => setMod("emir")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              mod === "emir" ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-400"
            }`}
          >
            Satılmamış Toplama PC
          </button>
        )}
        <button
          type="button"
          onClick={() => setMod("serbest")}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            mod === "serbest" ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-400"
          }`}
        >
          Hurda/Cihazdan Sökülen Parça
        </button>
      </div>

      {mod === "emir" ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Toplama Emri</label>
          <select value={emirId} onChange={(e) => setEmirId(e.target.value)} className={alanSinifi}>
            {tamamlanmisEmirler.map((e) => (
              <option key={e.id} value={e.id}>
                {e.order_no}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Bu emrin tüm parçaları stoğa geri döner, toplanan ürün kaydı pasife alınır.
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            İkinci el parça olarak stoğa alınacak ürünler
          </label>
          <UrunEkleSatiri onEkle={(k) => setKalemler((ks) => [...ks, k])} />
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
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Notlar</label>
        <textarea rows={2} value={notlar} onChange={(e) => setNotlar(e.target.value)} className={`${alanSinifi} resize-none`} />
      </div>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
      )}
      {basari && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          ✓ Parçalar stoğa eklendi.
        </div>
      )}

      <button
        type="button"
        onClick={demonteEt}
        disabled={yukleniyor}
        className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {yukleniyor ? "İşleniyor…" : "Demonte Et ve Stoğa Al"}
      </button>
    </div>
  );
}
