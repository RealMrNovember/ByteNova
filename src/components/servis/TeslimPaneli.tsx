"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { teslimiTamamla } from "@/app/panel/servisler/[id]/actions";

type Aksesuar = { name: string; delivered: boolean };

type Props = {
  servisId: string;
  aksesuarlar: Aksesuar[];
  teslimEdildiMi: boolean;
  teslimTarihi: string | null;
  yetkili: boolean;
};

export function TeslimPaneli({
  servisId,
  aksesuarlar: ilk,
  teslimEdildiMi,
  teslimTarihi,
  yetkili,
}: Props) {
  const router = useRouter();
  const [aksesuarlar, setAksesuarlar] = useState(ilk);
  const [teslimNotu, setTeslimNotu] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function toggle(ad: string) {
    setAksesuarlar((a) =>
      a.map((x) => (x.name === ad ? { ...x, delivered: !x.delivered } : x))
    );
  }

  async function tamamla() {
    setHata(null);
    setYukleniyor(true);
    const sonuc = await teslimiTamamla(servisId, aksesuarlar, teslimNotu);
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

      <div className="mt-4">
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
