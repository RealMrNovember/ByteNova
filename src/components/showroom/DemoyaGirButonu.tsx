"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEMO_EMAIL = "demo@bytenova.app";
const DEMO_PASSWORD = "ByteNovaDemo!2026";

export function DemoyaGirButonu() {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function demoyaGir() {
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (error) {
      setYukleniyor(false);
      setHata("Demo hesabına şu anda ulaşılamıyor. Lütfen birazdan tekrar deneyin.");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={demoyaGir}
        disabled={yukleniyor}
        className="w-full rounded-xl bg-nova-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-nova-500/25 transition hover:bg-nova-400 hover:shadow-nova-400/30 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {yukleniyor ? "Demoya giriliyor…" : "▶️ Demoyu Başlat"}
      </button>
      {hata && <p className="text-xs text-red-300">{hata}</p>}
    </div>
  );
}
