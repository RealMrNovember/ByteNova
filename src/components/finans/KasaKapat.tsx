"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";

type Props = {
  accountId: string;
  beklenenBakiye: number;
  bugunKapandiMi: boolean;
  yetkili: boolean;
};

export function KasaKapat({ accountId, beklenenBakiye, bugunKapandiMi, yetkili }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [fiiliBakiye, setFiiliBakiye] = useState(beklenenBakiye.toString());
  const [aciklama, setAciklama] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const fark = (Number(fiiliBakiye) || 0) - beklenenBakiye;

  async function kapat() {
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("kasa_kapat", {
      p_account_id: accountId,
      p_fiili_bakiye: Number(fiiliBakiye) || 0,
      p_aciklama: aciklama.trim() || null,
    });

    setKaydediliyor(false);
    if (error) {
      if (error.message.includes("FARK_ACIKLAMASI_GEREKLI")) {
        setHata("Beklenen ile fiili tutar farklı — açıklama zorunlu.");
        return;
      }
      setHata("Kasa kapatılamadı.");
      return;
    }

    setAcik(false);
    router.refresh();
  }

  if (bugunKapandiMi) {
    return (
      <div className="glass rounded-xl border border-emerald-500/20 p-5 text-center">
        <p className="text-sm font-medium text-emerald-300">✓ Bugün kapatıldı</p>
      </div>
    );
  }

  if (!yetkili) return null;

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
      >
        Bugünü Kapat
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Kasa Kapanışı</h2>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Beklenen (sistem)</span>
        <span className="font-medium text-slate-300">{paraFormatla(beklenenBakiye)}</span>
      </div>

      <label className="mt-3 block text-xs font-medium text-slate-300">Fiili sayılan tutar</label>
      <input
        type="number"
        step="0.01"
        autoFocus
        value={fiiliBakiye}
        onChange={(e) => setFiiliBakiye(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
      />

      {fark !== 0 && (
        <p className={`mt-2 text-xs font-medium ${fark > 0 ? "text-emerald-300" : "text-red-300"}`}>
          Fark: {fark > 0 ? "+" : ""}
          {paraFormatla(fark)}
        </p>
      )}

      {fark !== 0 && (
        <div className="mt-2">
          <label className="block text-xs font-medium text-slate-300">Fark açıklaması (zorunlu)</label>
          <input
            type="text"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder="Örn: sayım hatası, eksik/fazla para üstü"
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
        </div>
      )}

      {hata && <p className="mt-2.5 text-xs text-red-300">{hata}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={kapat}
          disabled={kaydediliyor || (fark !== 0 && !aciklama.trim())}
          className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {kaydediliyor ? "Kapatılıyor…" : "Kasayı Kapat"}
        </button>
        <button
          onClick={() => setAcik(false)}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
