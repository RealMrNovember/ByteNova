"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";

type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Props = {
  servisId: string;
  avansAlinan: number;
  yetkili: boolean;
  kasaHesaplari: KasaHesabi[];
};

export function ServisTahsilat({ servisId, avansAlinan, yetkili, kasaHesaplari }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [tutar, setTutar] = useState("");
  const [hesapId, setHesapId] = useState(kasaHesaplari[0]?.id ?? "");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kaporaAl() {
    const sayi = Number(tutar);
    if (!sayi || sayi <= 0) {
      setHata("Geçerli bir tutar girin.");
      return;
    }
    if (!hesapId) {
      setHata("Kasa hesabı seçin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("servis_tahsilat_al", {
      p_service_id: servisId,
      p_tutar: sayi,
      p_tip: "kapora",
      p_account_id: hesapId,
    });

    setKaydediliyor(false);
    if (error) {
      setHata("Kapora kaydedilemedi.");
      return;
    }

    setTutar("");
    setAcik(false);
    router.refresh();
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Kapora / Avans</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {avansAlinan > 0
              ? `Şimdiye kadar alınan: ${paraFormatla(avansAlinan)}`
              : "Henüz kapora alınmadı."}
          </p>
        </div>
        {yetkili && !acik && (
          <button
            onClick={() => setAcik(true)}
            className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            + Kapora Al
          </button>
        )}
      </div>

      {acik && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-slate-800 bg-surface-2 p-3.5">
          {!kasaHesaplari.length ? (
            <p className="text-xs text-amber-300">
              Önce Finans&apos;tan bir kasa hesabı oluşturmalısınız.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  placeholder="Tutar"
                  className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
                />
                <select
                  value={hesapId}
                  onChange={(e) => setHesapId(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
                >
                  {kasaHesaplari.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              {hata && <p className="text-xs text-red-300">{hata}</p>}
              <div className="flex gap-2">
                <button
                  onClick={kaporaAl}
                  disabled={kaydediliyor}
                  className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
                >
                  {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button
                  onClick={() => setAcik(false)}
                  className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
                >
                  Vazgeç
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
