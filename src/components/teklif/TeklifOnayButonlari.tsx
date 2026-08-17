"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TeklifOnayButonlari({ token }: { token: string }) {
  const router = useRouter();
  const [redFormAcik, setRedFormAcik] = useState(false);
  const [redNotu, setRedNotu] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function karar(deger: "kabul" | "reddedildi") {
    setGonderiliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("teklif_musteri_karari", {
      p_token: token,
      p_karar: deger,
      p_not: redNotu.trim() || null,
    });
    setGonderiliyor(false);
    if (error) {
      setHata("İşlem gerçekleştirilemedi. Sayfayı yenileyip tekrar deneyin.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => karar("kabul")}
          disabled={gonderiliyor}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
        >
          ✓ Teklifi Kabul Ediyorum
        </button>
        {!redFormAcik ? (
          <button
            onClick={() => setRedFormAcik(true)}
            className="flex-1 rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            ✕ Reddediyorum
          </button>
        ) : null}
      </div>

      {redFormAcik && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={redNotu}
            onChange={(e) => setRedNotu(e.target.value)}
            placeholder="İsterseniz kısa bir not bırakın (opsiyonel)"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
          <button
            onClick={() => karar("reddedildi")}
            disabled={gonderiliyor}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            {gonderiliyor ? "Gönderiliyor…" : "Reddi Onayla"}
          </button>
        </div>
      )}

      {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
    </div>
  );
}
