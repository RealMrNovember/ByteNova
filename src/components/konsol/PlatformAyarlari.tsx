"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { flagAyarla, paketDurumuDegistir } from "@/app/konsol/(app)/ayarlar/actions";

type FlagSatiri = { key: string; ad: string; ikon: string; durum: "off" | "coming_soon" | "beta" | "on" };
type PaketSatiri = { key: string; ad: string; ikon: string; durum: "draft" | "available" | "deprecated" };

const FLAG_DURUM_ADI: Record<string, string> = {
  off: "Kapalı",
  coming_soon: "Çok Yakında",
  beta: "İnşa Halinde (Beta)",
  on: "Aktif",
};
const PAKET_DURUM_ADI: Record<string, string> = {
  draft: "Taslak (gizli)",
  available: "Satışta",
  deprecated: "Kaldırıldı",
};

type Props = {
  flagSatirlari: FlagSatiri[];
  paketSatirlari: PaketSatiri[];
  duzenleyebilir: boolean;
};

export function PlatformAyarlari({ flagSatirlari, paketSatirlari, duzenleyebilir }: Props) {
  const router = useRouter();
  const [islenen, setIslenen] = useState<string | null>(null);

  async function flagDegistir(key: string, status: string) {
    setIslenen(key);
    await flagAyarla(key, status);
    setIslenen(null);
    router.refresh();
  }

  async function paketDegistir(key: string, status: string) {
    setIslenen(key);
    await paketDurumuDegistir(key, status);
    setIslenen(null);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Platform Ayarları</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Modül lansmanları ve eklenti paketi görünürlüğü — tüm işletmeleri etkiler.
        {!duzenleyebilir && " Bu ekran salt-okunur — yalnız Master/Yönetici rolü değiştirebilir."}
      </p>

      <div className="glass mt-6 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Modül Bayrakları</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Global durum — tenant'a özel override yalnız veritabanından atanır (bu ekranın kapsamı değil).
          </p>
        </div>
        <div className="divide-y divide-slate-800/60">
          {flagSatirlari.map((f) => (
            <div key={f.key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-base">{f.ikon}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{f.ad}</span>
              {duzenleyebilir ? (
                <select
                  value={f.durum}
                  onChange={(e) => flagDegistir(f.key, e.target.value)}
                  disabled={islenen === f.key}
                  className="rounded-lg border border-slate-700 bg-surface px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-500 disabled:opacity-50"
                >
                  {Object.entries(FLAG_DURUM_ADI).map(([v, ad]) => (
                    <option key={v} value={v}>
                      {ad}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-500">{FLAG_DURUM_ADI[f.durum]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Eklenti Paketleri</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            "Taslak" işletmelerin Ayarlar &gt; Eklentiler kataloğunda görünmez.
          </p>
        </div>
        <div className="divide-y divide-slate-800/60">
          {paketSatirlari.map((p) => (
            <div key={p.key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-base">{p.ikon}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{p.ad}</span>
              {duzenleyebilir ? (
                <select
                  value={p.durum}
                  onChange={(e) => paketDegistir(p.key, e.target.value)}
                  disabled={islenen === p.key}
                  className="rounded-lg border border-slate-700 bg-surface px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-500 disabled:opacity-50"
                >
                  {Object.entries(PAKET_DURUM_ADI).map(([v, ad]) => (
                    <option key={v} value={v}>
                      {ad}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-500">{PAKET_DURUM_ADI[p.durum]}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
