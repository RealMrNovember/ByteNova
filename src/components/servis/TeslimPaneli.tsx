"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { teslimiTamamla } from "@/app/panel/servisler/[id]/actions";
import { paraFormatla } from "@/lib/doviz";

type Aksesuar = { name: string; delivered: boolean };
type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Props = {
  servisId: string;
  aksesuarlar: Aksesuar[];
  teslimEdildiMi: boolean;
  teslimTarihi: string | null;
  yetkili: boolean;
  kasaYetkili: boolean;
  mevcutFinalTutar: number | null;
  avansAlinan: number;
  kasaHesaplari: KasaHesabi[];
};

export function TeslimPaneli({
  servisId,
  aksesuarlar: ilk,
  teslimEdildiMi,
  teslimTarihi,
  yetkili,
  kasaYetkili,
  mevcutFinalTutar,
  avansAlinan,
  kasaHesaplari,
}: Props) {
  const router = useRouter();
  const [aksesuarlar, setAksesuarlar] = useState(ilk);
  const [teslimNotu, setTeslimNotu] = useState("");
  const [finalTutar, setFinalTutar] = useState(mevcutFinalTutar?.toString() ?? "");
  const [hesapId, setHesapId] = useState(kasaHesaplari[0]?.id ?? "");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function toggle(ad: string) {
    setAksesuarlar((a) =>
      a.map((x) => (x.name === ad ? { ...x, delivered: !x.delivered } : x))
    );
  }

  const finalSayi = Number(finalTutar) || 0;
  const kalanTahsilat = Math.max(finalSayi - avansAlinan, 0);

  async function tamamla() {
    if (kalanTahsilat > 0 && !hesapId) {
      setHata("Kalan tutarı tahsil etmek için bir kasa hesabı seçin.");
      return;
    }
    setHata(null);
    setYukleniyor(true);
    const sonuc = await teslimiTamamla(
      servisId,
      aksesuarlar,
      teslimNotu,
      finalTutar ? finalSayi : null,
      kalanTahsilat > 0 ? kalanTahsilat : null,
      kalanTahsilat > 0 ? hesapId : null
    );
    setYukleniyor(false);
    if (!sonuc.ok) {
      setHata("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
      return;
    }
    router.refresh();
  }

  if (teslimEdildiMi) {
    return (
      <div className="glass rounded-xl border border-emerald-500/20 p-5">
        <p className="text-sm font-medium text-emerald-300">
          ✓ Cihaz teslim edildi
        </p>
        {teslimTarihi && (
          <p className="mt-0.5 text-xs text-slate-500">
            {new Date(teslimTarihi).toLocaleString("tr-TR")}
          </p>
        )}
      </div>
    );
  }

  if (!yetkili) return null;

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Teslim İşlemi</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Teslim edilen aksesuarları işaretleyip servisi kapatın.
      </p>

      {aksesuarlar.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {aksesuarlar.map((a) => (
            <label
              key={a.name}
              className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-surface px-3 py-2 text-sm text-slate-300"
            >
              <input
                type="checkbox"
                checked={a.delivered}
                onChange={() => toggle(a.name)}
                className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0 focus:ring-offset-0"
              />
              {a.name}
            </label>
          ))}
        </div>
      )}

      <div className={`mt-4 grid gap-4 ${kasaYetkili ? "sm:grid-cols-2" : ""}`}>
        {kasaYetkili && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Toplam tutar (opsiyonel)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={finalTutar}
              onChange={(e) => setFinalTutar(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Teslim notu (opsiyonel)
          </label>
          <input
            type="text"
            value={teslimNotu}
            onChange={(e) => setTeslimNotu(e.target.value)}
            placeholder="Örn: Müşteriye test videosu gösterildi."
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
        </div>
      </div>

      {kasaYetkili && finalSayi > 0 && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Toplam</span>
            <span>{paraFormatla(finalSayi)}</span>
          </div>
          {avansAlinan > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Alınan kapora (mahsup)</span>
              <span>-{paraFormatla(avansAlinan)}</span>
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-800 pt-1.5">
            <span className="text-sm font-medium text-slate-200">Kalan Tahsilat</span>
            <span className="text-base font-bold text-nova-300">{paraFormatla(kalanTahsilat)}</span>
          </div>
          {kalanTahsilat > 0 && (
            <select
              value={hesapId}
              onChange={(e) => setHesapId(e.target.value)}
              className={`mt-2.5 w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-nova-500 ${
                hesapId ? "border-slate-700 text-slate-200" : "border-amber-500/40 text-amber-300"
              }`}
            >
              <option value="">Kasa hesabı seçin…</option>
              {kasaHesaplari.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}

      <button
        onClick={tamamla}
        disabled={yukleniyor}
        className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
      >
        {yukleniyor ? "Kaydediliyor…" : "✓ Teslimi Tamamla"}
      </button>
    </div>
  );
}
