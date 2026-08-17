"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SozlesmeIslemleri({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [onayAcik, setOnayAcik] = useState(false);
  const [iptalEdiliyor, setIptalEdiliyor] = useState(false);

  async function iptalEt() {
    setIptalEdiliyor(true);
    const supabase = createClient();
    await supabase.rpc("sozlesme_iptal_et", { p_contract_id: contractId });
    setIptalEdiliyor(false);
    router.refresh();
  }

  return (
    <div className="glass mt-4 flex items-center justify-between rounded-xl p-4">
      <p className="text-xs text-slate-500">Sözleşmeyi erken sonlandırmak isterseniz iptal edebilirsiniz.</p>
      {onayAcik ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={iptalEt}
            disabled={iptalEdiliyor}
            className="rounded-lg bg-red-500/15 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {iptalEdiliyor ? "İptal ediliyor…" : "Evet, İptal Et"}
          </button>
          <button
            type="button"
            onClick={() => setOnayAcik(false)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOnayAcik(true)}
          className="shrink-0 rounded-lg border border-red-500/25 px-3.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
        >
          Sözleşmeyi İptal Et
        </button>
      )}
    </div>
  );
}
