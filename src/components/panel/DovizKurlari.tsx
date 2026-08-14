"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type KurSatiri = {
  code: string;
  name: string;
  symbol: string;
  globalRate: number | null;
  tenantRate: number | null;
};

type Props = {
  tenantId: string;
  yetkili: boolean;
  kurlar: KurSatiri[];
};

export function DovizKurlari({ tenantId, yetkili, kurlar: ilk }: Props) {
  const [kurlar, setKurlar] = useState(ilk);
  const [girisler, setGirisler] = useState<Record<string, string>>(
    Object.fromEntries(ilk.map((k) => [k.code, k.tenantRate?.toString() ?? ""]))
  );
  const [islemdeki, setIslemdeki] = useState<string | null>(null);

  async function kaydet(code: string) {
    const deger = Number(girisler[code]);
    if (!deger || deger <= 0) return;
    setIslemdeki(code);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("exchange_rates").upsert(
      {
        currency_code: code,
        tenant_id: tenantId,
        rate_to_try: deger,
        source: "manual",
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "currency_code,tenant_id" }
    );

    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "kur_manuel_guncellendi",
        p_entity: "exchange_rate",
        p_entity_id: code,
        p_new: { rate_to_try: deger },
      });
      setKurlar((k) =>
        k.map((x) => (x.code === code ? { ...x, tenantRate: deger } : x))
      );
    }
    setIslemdeki(null);
  }

  async function tcmbyeDon(code: string) {
    setIslemdeki(code);
    const supabase = createClient();
    const { error } = await supabase
      .from("exchange_rates")
      .delete()
      .eq("currency_code", code)
      .eq("tenant_id", tenantId);

    if (!error) {
      setKurlar((k) =>
        k.map((x) => (x.code === code ? { ...x, tenantRate: null } : x))
      );
      setGirisler((g) => ({ ...g, [code]: "" }));
    }
    setIslemdeki(null);
  }

  return (
    <div id="doviz" className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Döviz Kurları</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        TCMB kurları her gün otomatik güncellenir. Dilerseniz kendi
        &quot;dükkân kurunuzu&quot; girip TCMB kurunun önüne geçirebilirsiniz.
      </p>

      <div className="mt-4 space-y-2.5">
        {kurlar.map((k) => (
          <div
            key={k.code}
            className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-surface px-3.5 py-3 sm:flex-row sm:items-center"
          >
            <div className="flex w-32 shrink-0 items-center gap-2">
              <span className="text-base">{k.symbol}</span>
              <div>
                <p className="text-sm font-medium text-slate-200">{k.code}</p>
                <p className="text-[10px] text-slate-500">
                  TCMB: {k.globalRate?.toLocaleString("tr-TR") ?? "—"}
                </p>
              </div>
            </div>

            {yetkili ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={girisler[k.code] ?? ""}
                  onChange={(e) =>
                    setGirisler((g) => ({ ...g, [k.code]: e.target.value }))
                  }
                  placeholder={`TCMB kuru kullanılıyor (${k.globalRate ?? "—"})`}
                  className="w-full max-w-[180px] rounded-lg border border-slate-700 bg-surface-2 px-3 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
                />
                <button
                  onClick={() => kaydet(k.code)}
                  disabled={islemdeki === k.code || !girisler[k.code]}
                  className="rounded-lg bg-nova-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Kaydet
                </button>
                {k.tenantRate != null && (
                  <button
                    onClick={() => tcmbyeDon(k.code)}
                    disabled={islemdeki === k.code}
                    className="text-xs text-slate-500 hover:text-red-300"
                  >
                    TCMB&apos;ye dön
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-300">
                {(k.tenantRate ?? k.globalRate)?.toLocaleString("tr-TR") ?? "—"} TL
              </p>
            )}

            {k.tenantRate != null && (
              <span className="shrink-0 rounded-full bg-nova-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-nova-300">
                Dükkân kuru aktif
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
