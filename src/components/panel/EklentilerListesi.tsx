"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  faturaModeliEtiket,
  fiyatGoster,
  type EklentiAbonelikDurum,
  type EklentiPaketi,
} from "@/lib/eklenti";

type Props = {
  yetkili: boolean;
  paketler: EklentiPaketi[];
  abonelikler: Record<string, EklentiAbonelikDurum>;
};

const DURUM_ROZET: Record<EklentiAbonelikDurum, { etiket: string; sinif: string }> = {
  active: { etiket: "✓ Etkin", sinif: "bg-emerald-500/15 text-emerald-300" },
  trial: { etiket: "Deneme", sinif: "bg-amber-500/15 text-amber-300" },
  past_due: { etiket: "Ödeme Bekliyor", sinif: "bg-red-500/15 text-red-300" },
  cancelled: { etiket: "İptal Edildi", sinif: "bg-slate-500/15 text-slate-400" },
};

export function EklentilerListesi({ yetkili, paketler, abonelikler: ilk }: Props) {
  const [abonelikler, setAbonelikler] = useState(ilk);
  const [islemdeki, setIslemdeki] = useState<string | null>(null);

  async function etkinlestir(paket: EklentiPaketi) {
    setIslemdeki(paket.key);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profil } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user?.id)
      .single();

    const { error } = await supabase.from("tenant_addon_subscriptions").upsert(
      {
        tenant_id: profil?.tenant_id,
        addon_key: paket.key,
        status: "active",
        activated_by: user?.id,
        activated_at: new Date().toISOString(),
        cancelled_at: null,
      },
      { onConflict: "tenant_id,addon_key" }
    );

    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "eklenti_etkinlestirildi",
        p_entity: "addon_package",
        p_entity_id: paket.key,
        p_new: { addon_key: paket.key, price: paket.monthly_price },
      });
      setAbonelikler((a) => ({ ...a, [paket.key]: "active" }));
    }
    setIslemdeki(null);
  }

  async function devreDisiBirak(paket: EklentiPaketi) {
    setIslemdeki(paket.key);
    const supabase = createClient();
    const { data: profil } = await supabase
      .from("profiles")
      .select("tenant_id")
      .single();

    const { error } = await supabase
      .from("tenant_addon_subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("addon_key", paket.key)
      .eq("tenant_id", profil?.tenant_id);

    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "eklenti_iptal_edildi",
        p_entity: "addon_package",
        p_entity_id: paket.key,
      });
      setAbonelikler((a) => ({ ...a, [paket.key]: "cancelled" }));
    }
    setIslemdeki(null);
  }

  return (
    <div id="eklentiler" className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Eklentiler</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Çekirdek ürüne ek, ihtiyacınız oldukça açabileceğiniz ücretli
        modüller. İptal ettiğinizde verileriniz silinmez.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {paketler.map((p) => {
          const durum = abonelikler[p.key];
          const etkin = durum === "active" || durum === "trial";
          const rozet = durum ? DURUM_ROZET[durum] : null;

          return (
            <div
              key={p.key}
              className={`rounded-xl border p-4 transition-colors ${
                etkin
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-slate-800 bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fiyatGoster(p)} · {faturaModeliEtiket(p.billing_model)}
                    </p>
                  </div>
                </div>
                {rozet && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${rozet.sinif}`}
                  >
                    {rozet.etiket}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {p.description}
              </p>

              {yetkili && (
                <button
                  onClick={() =>
                    etkin ? devreDisiBirak(p) : etkinlestir(p)
                  }
                  disabled={islemdeki === p.key}
                  className={`mt-4 w-full rounded-lg px-3.5 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                    etkin
                      ? "border border-red-500/30 text-red-300 hover:bg-red-500/10"
                      : "bg-nova-500 text-slate-950 hover:bg-nova-400"
                  }`}
                >
                  {islemdeki === p.key
                    ? "İşleniyor…"
                    : etkin
                      ? "Devre Dışı Bırak"
                      : "Etkinleştir"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-slate-600">
        💳 Otomatik kart tahsilatı yakında eklenecek — şimdilik etkinleştirme
        işletme yetkilisi tarafından yapılır ve faturalandırma ekibimiz
        sizinle ayrıca iletişime geçer.
      </p>
    </div>
  );
}
