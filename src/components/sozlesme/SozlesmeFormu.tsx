"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";

type Musteri = { id: string; name: string; phone: string | null };

export function SozlesmeFormu({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [ad, setAd] = useState("");
  const [kapsam, setKapsam] = useState("");
  const [cihazSayisi, setCihazSayisi] = useState("");
  const [periyotAy, setPeriyotAy] = useState("1");
  const [aylikBedel, setAylikBedel] = useState("");
  const [paraBirimi, setParaBirimi] = useState("TRY");
  const [slaSaat, setSlaSaat] = useState("48");
  const [faturalamaGunu, setFaturalamaGunu] = useState("1");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const alanSinifi =
    "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-nova-500";

  async function kaydet() {
    if (!musteri) {
      setHata("Müşteri seçin.");
      return;
    }
    if (!ad.trim() || !aylikBedel || !baslangic || !bitis) {
      setHata("Sözleşme adı, aylık bedel ve tarihler zorunludur.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("bakim_sozlesmesi_olustur", {
      p_musteri_id: musteri.id,
      p_ad: ad.trim(),
      p_kapsam: kapsam.trim() || null,
      p_cihaz_sayisi: cihazSayisi ? Number(cihazSayisi) : null,
      p_periyot_ay: Number(periyotAy),
      p_aylik_bedel: Number(aylikBedel),
      p_para_birimi: paraBirimi,
      p_sla_saat: slaSaat ? Number(slaSaat) : null,
      p_faturalama_gunu: faturalamaGunu ? Number(faturalamaGunu) : null,
      p_baslangic: baslangic,
      p_bitis: bitis,
    });
    setKaydediliyor(false);
    if (error || !data) {
      setHata(
        error?.message.includes("bitiş tarihi")
          ? "Bitiş tarihi başlangıçtan sonra olmalı."
          : "Sözleşme oluşturulamadı."
      );
      return;
    }
    router.push(`/panel/sozlesmeler/${data}`);
    router.refresh();
  }

  return (
    <div className="glass space-y-4 rounded-xl p-6">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Müşteri *</label>
        <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Sözleşme Adı *</label>
        <input
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Örn: 25 PC Yıllık Bakım Sözleşmesi"
          className={alanSinifi}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Kapsam</label>
        <textarea
          rows={2}
          value={kapsam}
          onChange={(e) => setKapsam(e.target.value)}
          placeholder="Hangi cihazlar/işler kapsama dahil?"
          className={`${alanSinifi} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Cihaz Sayısı</label>
          <input
            type="number"
            min={0}
            value={cihazSayisi}
            onChange={(e) => setCihazSayisi(e.target.value)}
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Ziyaret Periyodu (ay)</label>
          <input
            type="number"
            min={1}
            value={periyotAy}
            onChange={(e) => setPeriyotAy(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Aylık Bedel *</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={aylikBedel}
            onChange={(e) => setAylikBedel(e.target.value)}
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Para Birimi</label>
          <select value={paraBirimi} onChange={(e) => setParaBirimi(e.target.value)} className={alanSinifi}>
            <option value="TRY">TL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">SLA — Müdahale Süresi (saat)</label>
          <input
            type="number"
            min={1}
            value={slaSaat}
            onChange={(e) => setSlaSaat(e.target.value)}
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Faturalama Günü (ayın kaçı)</label>
          <input
            type="number"
            min={1}
            max={28}
            value={faturalamaGunu}
            onChange={(e) => setFaturalamaGunu(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Başlangıç Tarihi *</label>
          <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} className={alanSinifi} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Bitiş Tarihi *</label>
          <input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} className={alanSinifi} />
        </div>
      </div>

      <p className="text-[11px] text-slate-600">
        Kaydedince başlangıç-bitiş aralığında, girdiğiniz periyotta otomatik bir ziyaret takvimi
        üretilir. Faturalama günü yalnızca bilgi amaçlıdır — sözleşmeden otomatik fatura kesilmez,
        her dönem Satış'tan elle oluşturursunuz.
      </p>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
      )}

      <button
        type="button"
        onClick={kaydet}
        disabled={kaydediliyor}
        className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {kaydediliyor ? "Oluşturuluyor…" : "Sözleşmeyi Oluştur"}
      </button>
    </div>
  );
}
