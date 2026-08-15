"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  saleId: string;
  yetkili: boolean;
};

export function SatisBelgesi({ saleId, yetkili }: Props) {
  const router = useRouter();
  const [fisNo, setFisNo] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kes() {
    if (!fisNo.trim()) {
      setHata("Fiş numarası girin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("satis_belgesini_kes", {
      p_sale_id: saleId,
      p_fis_no: fisNo,
    });
    setKaydediliyor(false);
    if (error) {
      setHata("Belge kaydedilemedi.");
      return;
    }
    router.refresh();
  }

  if (!yetkili) return null;

  return (
    <div className="glass rounded-xl border border-amber-500/25 p-4">
      <p className="text-sm font-medium text-amber-200">🕐 Belge sonra kesilecek</p>
      <p className="mt-0.5 text-xs text-slate-500">
        ÖKC&apos;den fiş kesildiğinde numarasını buraya girin.
      </p>
      <div className="mt-2.5 flex gap-2">
        <input
          type="text"
          value={fisNo}
          onChange={(e) => setFisNo(e.target.value)}
          placeholder="Fiş no"
          className="flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        <button
          onClick={kes}
          disabled={kaydediliyor}
          className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Belgeyi Kes"}
        </button>
      </div>
      {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
    </div>
  );
}
