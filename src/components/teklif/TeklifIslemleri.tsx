"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { teklifiGonderildiIsaretle, teklifKarariKaydet, teklifiSatisaDonustur } from "@/app/panel/teklifler/[id]/actions";

type Props = {
  teklifId: string;
  publicToken: string;
  status: string;
  yonetebilir: boolean;
  donusturebilir: boolean;
};

export function TeklifIslemleri({ teklifId, publicToken, status, yonetebilir, donusturebilir }: Props) {
  const router = useRouter();
  const [isleniyor, setIsleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [redNotu, setRedNotu] = useState("");
  const [redFormAcik, setRedFormAcik] = useState(false);

  async function gonderildiIsaretle() {
    setIsleniyor(true);
    setHata(null);
    const sonuc = await teklifiGonderildiIsaretle(teklifId);
    setIsleniyor(false);
    if (!sonuc.ok) return setHata(sonuc.hata);
    router.refresh();
  }

  async function karariKaydet(karar: "kabul" | "reddedildi") {
    setIsleniyor(true);
    setHata(null);
    const sonuc = await teklifKarariKaydet(publicToken, karar, redNotu);
    setIsleniyor(false);
    if (!sonuc.ok) return setHata(sonuc.hata);
    setRedFormAcik(false);
    setRedNotu("");
    router.refresh();
  }

  async function satisaDonustur() {
    setIsleniyor(true);
    setHata(null);
    const sonuc = await teklifiSatisaDonustur(teklifId);
    setIsleniyor(false);
    if (!sonuc.ok) return setHata(sonuc.hata);
    router.push(`/panel/satis/${sonuc.saleId}`);
    router.refresh();
  }

  if (!yonetebilir) return null;

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">İşlemler</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "taslak" && (
          <button
            onClick={gonderildiIsaretle}
            disabled={isleniyor}
            className="rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            📤 Gönderildi Olarak İşaretle
          </button>
        )}
        {(status === "gonderildi" || status === "musteri_inceliyor") && (
          <>
            <button
              onClick={() => karariKaydet("kabul")}
              disabled={isleniyor}
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              ✓ Müşteri Kabul Etti (telefonla/yüz yüze)
            </button>
            {!redFormAcik ? (
              <button
                onClick={() => setRedFormAcik(true)}
                className="rounded-lg border border-red-600/40 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
              >
                ✕ Müşteri Reddetti
              </button>
            ) : (
              <div className="flex w-full flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={redNotu}
                  onChange={(e) => setRedNotu(e.target.value)}
                  placeholder="Red gerekçesi (opsiyonel)"
                  className="min-w-[180px] flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
                />
                <button
                  onClick={() => karariKaydet("reddedildi")}
                  disabled={isleniyor}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Onayla
                </button>
              </div>
            )}
          </>
        )}
        {status === "kabul" && donusturebilir && (
          <button
            onClick={satisaDonustur}
            disabled={isleniyor}
            className="rounded-lg bg-nova-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-50"
          >
            🧾 Satışa Dönüştür
          </button>
        )}
      </div>
      {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
    </div>
  );
}
