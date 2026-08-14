"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  featureKey: string;
  tenantId: string;
  baslangictaKayitli: boolean;
};

export function HaberVer({ featureKey, tenantId, baslangictaKayitli }: Props) {
  const [kayitli, setKayitli] = useState(baslangictaKayitli);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function haberVer() {
    setYukleniyor(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("feature_notify_requests").insert({
      feature_key: featureKey,
      tenant_id: tenantId,
      user_id: user.id,
    });

    setYukleniyor(false);
    if (!error || error.code === "23505") {
      // 23505 = zaten kayıtlı (unique) — sonuç aynı
      setKayitli(true);
    }
  }

  if (kayitli) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-xs text-emerald-300">
        ✓ Kaydınız alındı — bu modül aktifleştiğinde size haber vereceğiz.
      </div>
    );
  }

  return (
    <button
      onClick={haberVer}
      disabled={yukleniyor}
      className="mt-8 rounded-xl bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
    >
      {yukleniyor ? "Kaydediliyor…" : "🔔 Hazır olunca haber ver"}
    </button>
  );
}
