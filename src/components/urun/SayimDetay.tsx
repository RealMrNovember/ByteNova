"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Kalem = {
  id: string;
  product_id: string;
  urunAdi: string;
  sku: string | null;
  birim: string;
  expected_quantity: number;
  counted_quantity: number | null;
};

type Props = {
  sayimId: string;
  durum: string;
  yetkili: boolean;
  kalemler: Kalem[];
};

export function SayimDetay({ sayimId, durum, yetkili, kalemler: ilk }: Props) {
  const router = useRouter();
  const [kalemler, setKalemler] = useState(ilk);
  const [tamamlaniyor, setTamamlaniyor] = useState(false);
  const [iptalEdiliyor, setIptalEdiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const zamanlayicilar = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const taslakMi = durum === "taslak";
  const girilenSayisi = kalemler.filter((k) => k.counted_quantity != null).length;
  const farkliSayisi = kalemler.filter(
    (k) => k.counted_quantity != null && k.counted_quantity !== k.expected_quantity
  ).length;

  function miktarDegisti(kalemId: string, deger: string) {
    const sayi = deger === "" ? null : Number(deger);
    setKalemler((k) =>
      k.map((x) => (x.id === kalemId ? { ...x, counted_quantity: sayi } : x))
    );

    if (zamanlayicilar.current[kalemId]) clearTimeout(zamanlayicilar.current[kalemId]);
    if (sayi == null || Number.isNaN(sayi)) return;

    zamanlayicilar.current[kalemId] = setTimeout(async () => {
      const supabase = createClient();
      await supabase.rpc("sayim_miktar_gir", { p_kalem_id: kalemId, p_miktar: sayi });
    }, 500);
  }

  async function tamamla() {
    if (!window.confirm(`${farkliSayisi} üründe fark var. Sayımı tamamlayıp stoğu düzeltmek istiyor musunuz?`)) {
      return;
    }
    setTamamlaniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("sayim_tamamla", { p_sayim_id: sayimId });
    setTamamlaniyor(false);

    if (error) {
      setHata("Sayım tamamlanamadı.");
      return;
    }
    router.refresh();
  }

  async function iptalEt() {
    if (!window.confirm("Bu sayımı iptal etmek istediğinize emin misiniz?")) return;
    setIptalEdiliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("sayim_iptal", { p_sayim_id: sayimId });
    setIptalEdiliyor(false);

    if (error) {
      setHata("Sayım iptal edilemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {durum !== "taslak" && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-xs ${
            durum === "tamamlandi"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-slate-500/10 text-slate-400"
          }`}
        >
          {durum === "tamamlandi"
            ? "✓ Bu sayım tamamlandı ve stok farkları uygulandı."
            : "Bu sayım iptal edildi."}
        </div>
      )}

      <div className="glass overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <p className="text-xs text-slate-400">
            {girilenSayisi}/{kalemler.length} sayıldı · {farkliSayisi} farklı
          </p>
          {taslakMi && yetkili && (
            <div className="flex gap-2">
              <button
                onClick={iptalEt}
                disabled={iptalEdiliyor || tamamlaniyor}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
              >
                İptal Et
              </button>
              <button
                onClick={tamamla}
                disabled={tamamlaniyor || iptalEdiliyor || girilenSayisi === 0}
                className="rounded-lg bg-nova-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tamamlaniyor ? "Tamamlanıyor…" : "Sayımı Tamamla"}
              </button>
            </div>
          )}
        </div>

        {hata && (
          <p className="border-b border-slate-800 bg-red-500/10 px-4 py-2 text-xs text-red-300">
            {hata}
          </p>
        )}

        <div className="divide-y divide-slate-800/60">
          {kalemler.map((k) => {
            const fark =
              k.counted_quantity != null ? k.counted_quantity - k.expected_quantity : null;
            return (
              <div key={k.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{k.urunAdi}</p>
                  <p className="text-[11px] text-slate-500">
                    Sistemde: {k.expected_quantity} {k.birim}
                    {k.sku ? ` · ${k.sku}` : ""}
                  </p>
                </div>
                {taslakMi && yetkili ? (
                  <input
                    type="number"
                    step="0.01"
                    value={k.counted_quantity ?? ""}
                    onChange={(e) => miktarDegisti(k.id, e.target.value)}
                    placeholder="Sayılan"
                    className="w-24 shrink-0 rounded-lg border border-slate-700 bg-surface px-2.5 py-1.5 text-right text-sm text-slate-200 outline-none focus:border-nova-500"
                  />
                ) : (
                  <span className="w-24 shrink-0 text-right text-sm text-slate-400">
                    {k.counted_quantity ?? "—"}
                  </span>
                )}
                <span
                  className={`w-16 shrink-0 text-right text-xs font-semibold ${
                    fark == null
                      ? "text-slate-600"
                      : fark === 0
                        ? "text-slate-500"
                        : fark > 0
                          ? "text-emerald-300"
                          : "text-red-300"
                  }`}
                >
                  {fark == null ? "—" : `${fark > 0 ? "+" : ""}${fark}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
