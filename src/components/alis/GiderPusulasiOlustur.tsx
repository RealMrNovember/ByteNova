"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GiderPusulasiOlustur({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [tutar, setTutar] = useState("");
  const [stopajOrani, setStopajOrani] = useState("0");
  const [aciklama, setAciklama] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const tutarSayi = Number(tutar) || 0;
  const stopajSayi = Number(stopajOrani) || 0;
  const stopajTutari = Math.round(tutarSayi * (stopajSayi / 100) * 100) / 100;
  const netTutar = tutarSayi - stopajTutari;

  async function olustur() {
    if (!tutarSayi || tutarSayi <= 0) {
      setHata("Geçerli bir tutar girin.");
      return;
    }
    if (!aciklama.trim()) {
      setHata("Açıklama (ne alındığı) gerekli.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("gider_pusulasi_olustur", {
      p_supplier_id: supplierId,
      p_tutar: tutarSayi,
      p_aciklama: aciklama.trim(),
      p_stopaj_orani: stopajSayi,
    });
    setKaydediliyor(false);
    if (error || !data) {
      setHata("Gider pusulası oluşturulamadı.");
      return;
    }
    window.open(`/api/gider-pusulasi/${data}/pdf`, "_blank");
    setAcik(false);
    setTutar("");
    setAciklama("");
    setStopajOrani("0");
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400"
      >
        🧾 Gider Pusulası Oluştur
      </button>
    );
  }

  return (
    <div className="glass rounded-xl border border-nova-500/30 p-4">
      <p className="text-sm font-medium text-white">Gider Pusulası Oluştur</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Vergi mükellefi olmayan bu tedarikçiden yapılan alım için gider pusulası düzenler.
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Açıklama (ne alındığı)
          </label>
          <input
            type="text"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder="Örn: İkinci el Dell Latitude 5420 laptop"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Tutar (TL)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Stopaj oranı (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={stopajOrani}
              onChange={(e) => setStopajOrani(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
          </div>
        </div>
        {tutarSayi > 0 && (
          <p className="text-xs text-slate-500">
            Stopaj: {stopajTutari.toLocaleString("tr-TR")} ₺ · Net ödenecek:{" "}
            <span className="font-medium text-slate-300">{netTutar.toLocaleString("tr-TR")} ₺</span>
          </p>
        )}
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          Stopaj oranı sabit değildir, siz belirlersiniz — gerçek oran ürün grubuna ve güncel
          mevzuata göre değişir. Emin değilseniz mali müşavirinize danışın.
        </p>
        {hata && <p className="text-xs text-red-300">{hata}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={olustur}
            disabled={kaydediliyor}
            className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
          >
            {kaydediliyor ? "Oluşturuluyor…" : "Oluştur ve PDF Aç"}
          </button>
          <button
            type="button"
            onClick={() => setAcik(false)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
