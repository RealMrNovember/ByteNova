"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function YeniSayimButonu({ devamEdenVarMi }: { devamEdenVarMi: boolean }) {
  const router = useRouter();
  const [basliyor, setBasliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function baslat() {
    setBasliyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sayim_baslat");
    setBasliyor(false);

    if (error || !data) {
      setHata("Sayım başlatılamadı.");
      return;
    }
    router.push(`/panel/stok/sayim/${data}`);
  }

  return (
    <div className="text-right">
      <button
        onClick={baslat}
        disabled={basliyor || devamEdenVarMi}
        title={devamEdenVarMi ? "Devam eden bir sayım var — önce onu tamamlayın veya iptal edin" : undefined}
        className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {basliyor ? "Başlatılıyor…" : "+ Yeni Sayım"}
      </button>
      {devamEdenVarMi && (
        <p className="mt-1 text-[11px] text-slate-500">Devam eden bir sayım var</p>
      )}
      {hata && <p className="mt-1 text-[11px] text-red-300">{hata}</p>}
    </div>
  );
}
