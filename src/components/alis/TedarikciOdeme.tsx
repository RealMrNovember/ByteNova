"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Props = {
  supplierId: string;
  bakiye: number;
  paraBirimi: string;
  guncelKur: number | null;
  yetkili: boolean;
  kasaHesaplari: KasaHesabi[];
};

export function TedarikciOdeme({ supplierId, bakiye, paraBirimi, guncelKur, yetkili, kasaHesaplari }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [tutar, setTutar] = useState(bakiye > 0 ? bakiye.toString() : "");
  const [kur, setKur] = useState(paraBirimi === "TRY" ? "1" : (guncelKur?.toString() ?? ""));
  const [hesapId, setHesapId] = useState(kasaHesaplari[0]?.id ?? "");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const kurSayi = Number(kur) || 0;
  const tlKarsiligi = (Number(tutar) || 0) * kurSayi;

  async function odemeYap() {
    const sayi = Number(tutar);
    if (!sayi || sayi <= 0) {
      setHata("Geçerli bir tutar girin.");
      return;
    }
    if (!hesapId) {
      setHata("Kasa hesabı seçin.");
      return;
    }
    if (kurSayi <= 0) {
      setHata("Geçerli bir kur girin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("tedarikci_odeme_yap", {
      p_supplier_id: supplierId,
      p_tutar_doviz: sayi,
      p_kur: kurSayi,
      p_account_id: hesapId,
      p_aciklama: null,
    });

    setKaydediliyor(false);
    if (error) {
      setHata("Ödeme kaydedilemedi.");
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
          <h2 className="text-sm font-semibold text-white">Cari Bakiye</h2>
          <p className={`mt-1 text-2xl font-bold ${bakiye > 0 ? "text-amber-300" : "text-slate-200"}`}>
            {bakiye.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {paraBirimi}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {bakiye > 0 ? "Tedarikçiye olan borcumuz" : "Borç yok"}
          </p>
        </div>
        {yetkili && bakiye > 0 && !acik && (
          <button
            onClick={() => setAcik(true)}
            className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            + Ödeme Yap
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
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Tutar ({paraBirimi})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={tutar}
                    onChange={(e) => setTutar(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Kur</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    disabled={paraBirimi === "TRY"}
                    value={kur}
                    onChange={(e) => setKur(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500 disabled:opacity-40"
                  />
                </div>
              </div>
              <select
                value={hesapId}
                onChange={(e) => setHesapId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              >
                {kasaHesaplari.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {paraBirimi !== "TRY" && kurSayi > 0 && (
                <p className="text-[11px] text-slate-500">
                  Kasadan çıkacak: {tlKarsiligi.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL
                </p>
              )}
              {hata && <p className="text-xs text-red-300">{hata}</p>}
              <div className="flex gap-2">
                <button
                  onClick={odemeYap}
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
