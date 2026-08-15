"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Props = {
  returnId: string;
  urunAdi: string;
  miktar: number;
  onerilenTutar: number;
  musteriVarMi: boolean;
  kasaHesaplari: KasaHesabi[];
};

const SONUCLAR = [
  { deger: "satilabilir", etiket: "✅ Satılabilir", aciklama: "Stoğa geri alınır" },
  { deger: "arizali", etiket: "⚠️ Arızalı", aciklama: "Stoğa dönmez" },
  { deger: "hurda", etiket: "🗑️ Hurda", aciklama: "Stoğa dönmez" },
  { deger: "servise", etiket: "🔧 Servise", aciklama: "Yeni servis kaydı açılır" },
] as const;

export function IadeKontrol({ returnId, urunAdi, miktar, onerilenTutar, musteriVarMi, kasaHesaplari }: Props) {
  const router = useRouter();
  const [sonuc, setSonuc] = useState<string>("satilabilir");
  const [refundYontemi, setRefundYontemi] = useState<"nakit_iade" | "iade_yok">("nakit_iade");
  const [tutar, setTutar] = useState(onerilenTutar.toString());
  const [hesapId, setHesapId] = useState(kasaHesaplari[0]?.id ?? "");
  const [servisBeyani, setServisBeyani] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kaydet() {
    if (sonuc === "servise" && !musteriVarMi) {
      setHata("Servise yönlendirmek için satışta müşteri bilgisi olmalı.");
      return;
    }
    if (refundYontemi === "nakit_iade" && (!Number(tutar) || !hesapId)) {
      setHata("Nakit iade için tutar ve kasa hesabı girin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("iade_kontrol_et", {
      p_return_id: returnId,
      p_sonuc: sonuc,
      p_refund_yontemi: refundYontemi,
      p_refund_tutar: refundYontemi === "nakit_iade" ? Number(tutar) : null,
      p_refund_hesap_id: refundYontemi === "nakit_iade" ? hesapId : null,
      p_servis_beyani: sonuc === "servise" ? servisBeyani.trim() || null : null,
    });

    setKaydediliyor(false);
    if (error) {
      setHata(
        error.message.includes("müşteri bilgisi")
          ? "Servise yönlendirmek için satışta müşteri bilgisi olmalı."
          : "İade kontrol edilemedi."
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-sm font-medium text-slate-200">{urunAdi}</p>
      <p className="text-[11px] text-slate-500">{miktar} adet iade edildi — kontrol sonucu seçin</p>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {SONUCLAR.map((s) => (
          <button
            key={s.deger}
            type="button"
            onClick={() => setSonuc(s.deger)}
            title={s.aciklama}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              sonuc === s.deger
                ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {s.etiket}
          </button>
        ))}
      </div>

      {sonuc === "servise" && (
        <div className="mt-2.5">
          {!musteriVarMi && (
            <p className="text-xs text-amber-300">
              ⚠️ Bu satışta müşteri kaydı yok — servise yönlendirmek için müşteri gerekli.
            </p>
          )}
          <input
            type="text"
            value={servisBeyani}
            onChange={(e) => setServisBeyani(e.target.value)}
            placeholder="Servis beyanı (opsiyonel)"
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-400">Para İadesi</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setRefundYontemi("nakit_iade")}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              refundYontemi === "nakit_iade"
                ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            💵 Nakit İade
          </button>
          <button
            type="button"
            onClick={() => setRefundYontemi("iade_yok")}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              refundYontemi === "iade_yok"
                ? "border-nova-500/60 bg-nova-500/10 text-nova-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            İade Yok
          </button>
        </div>
        {refundYontemi === "nakit_iade" && (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <input
              type="number"
              step="0.01"
              min="0"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
            <select
              value={hesapId}
              onChange={(e) => setHesapId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            >
              <option value="">Kasa hesabı seçin…</option>
              {kasaHesaplari.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hata && <p className="mt-2.5 text-xs text-red-300">{hata}</p>}

      <button
        onClick={kaydet}
        disabled={kaydediliyor}
        className="mt-3 w-full rounded-lg bg-nova-500 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
      >
        {kaydediliyor ? "Kaydediliyor…" : "Kontrolü Tamamla"}
      </button>
    </div>
  );
}
