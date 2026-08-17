"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";
import { tenantDurum } from "@/lib/konsol";

type Plan = {
  id: string;
  key: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  max_users: number | null;
};

type Dekont = {
  id: string;
  amount: number | null;
  status: "bekliyor" | "onaylandi" | "reddedildi";
  review_note: string | null;
  created_at: string;
};

type Olay = {
  id: number;
  event_type: string;
  description: string;
  created_at: string;
};

type Props = {
  tenantId: string;
  status: string;
  trialEndsAt: string | null;
  plan: Plan | null;
  billingCycle: "aylik" | "yillik" | null;
  dekontlar: Dekont[];
  olaylar: Olay[];
  yukleyebilir: boolean;
};

const DEKONT_DURUM: Record<string, { ad: string; sinif: string }> = {
  bekliyor: { ad: "İnceleniyor", sinif: "bg-amber-500/15 text-amber-300" },
  onaylandi: { ad: "Onaylandı", sinif: "bg-emerald-500/15 text-emerald-300" },
  reddedildi: { ad: "Reddedildi", sinif: "bg-red-500/15 text-red-300" },
};

const OLAY_IKON: Record<string, string> = {
  plan_degisti: "🔄",
  askiya_alindi: "⏸️",
  yeniden_etkinlestirildi: "▶️",
  uzatildi: "⏳",
  dekont_yuklendi: "📤",
  dekont_onaylandi: "✅",
  dekont_reddedildi: "❌",
  kapatildi: "🔒",
  deneme_bitti: "⌛",
};

export function AbonelikBolumu({
  tenantId,
  status,
  trialEndsAt,
  plan,
  billingCycle,
  dekontlar,
  olaylar,
  yukleyebilir,
}: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [dosya, setDosya] = useState<File | null>(null);
  const [tutar, setTutar] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const durum = tenantDurum(status);
  const fiyat = plan ? (billingCycle === "yillik" ? plan.yearly_price : plan.monthly_price) : null;
  const kalanGun =
    status === "trial" && trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  async function dekontGonder() {
    if (!dosya) {
      setHata("Dekont dosyası seçin.");
      return;
    }
    if (dosya.size > 5 * 1024 * 1024) {
      setHata("Dekont dosyası en fazla 5 MB olabilir.");
      return;
    }
    setYukleniyor(true);
    setHata(null);

    const supabase = createClient();
    const uzanti = dosya.name.split(".").pop() ?? "jpg";
    const yol = `${tenantId}/dekont/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${uzanti}`;

    const { error: yuklemeHatasi } = await supabase.storage
      .from("servis-belgeleri")
      .upload(yol, dosya, { contentType: dosya.type });
    if (yuklemeHatasi) {
      setYukleniyor(false);
      setHata("Dekont yüklenemedi.");
      return;
    }

    const { error } = await supabase.rpc("dekont_yukle", {
      p_storage_path: yol,
      p_tutar: tutar ? Number(tutar) : null,
      p_not: null,
    });

    setYukleniyor(false);
    if (error) {
      setHata("Dekont kaydedilemedi.");
      return;
    }
    setDosya(null);
    setTutar("");
    setAcik(false);
    router.refresh();
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Abonelik</h2>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durum.sinif}`}>
          {durum.etiket}
          {kalanGun !== null && ` · ${kalanGun}g kaldı`}
        </span>
      </div>

      {plan && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          <div>
            <p className="text-sm text-slate-200">{plan.name} Planı</p>
            <p className="text-[11px] text-slate-500">
              {plan.max_users ? `${plan.max_users} kullanıcıya kadar` : "Sınırsız kullanıcı"} ·{" "}
              {billingCycle === "yillik" ? "Yıllık" : "Aylık"} faturalama
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {paraFormatla(fiyat ?? 0)}
            <span className="text-[11px] font-normal text-slate-500">
              /{billingCycle === "yillik" ? "yıl" : "ay"}
            </span>
          </p>
        </div>
      )}

      {status === "past_due" && (
        <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
          Ödemeniz bekleniyor — süresinde tamamlanmazsa panel erişiminiz duracaktır.
        </p>
      )}

      {yukleyebilir && (status === "past_due" || status === "trial") && (
        <div className="mt-4">
          {!acik ? (
            <button
              onClick={() => setAcik(true)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
            >
              📤 Ödeme Dekontu Yükle
            </button>
          ) : (
            <div className="space-y-2.5">
              <label className="block cursor-pointer rounded-lg border border-dashed border-slate-700 px-4 py-3 text-center text-xs text-slate-500 hover:border-nova-500/50 hover:text-slate-300">
                {dosya ? `📎 ${dosya.name}` : "📎 Dekont dosyası seç (görsel/PDF)"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="Tutar (opsiyonel)"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
              />
              {hata && <p className="text-xs text-red-300">{hata}</p>}
              <div className="flex gap-2">
                <button
                  onClick={dekontGonder}
                  disabled={yukleniyor}
                  className="rounded-lg bg-nova-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
                >
                  {yukleniyor ? "Gönderiliyor…" : "Gönder"}
                </button>
                <button
                  onClick={() => setAcik(false)}
                  className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs text-slate-300"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {dekontlar.length > 0 && (
        <div className="mt-4 divide-y divide-slate-800/60 border-t border-slate-800/60 pt-2">
          {dekontlar.map((d) => {
            const dd = DEKONT_DURUM[d.status];
            return (
              <div key={d.id} className="flex items-center justify-between py-2 text-xs">
                <span className="text-slate-400">
                  {new Date(d.created_at).toLocaleDateString("tr-TR")}
                  {d.amount != null && ` · ${paraFormatla(d.amount)}`}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dd.sinif}`}>{dd.ad}</span>
              </div>
            );
          })}
        </div>
      )}

      {olaylar.length > 0 && (
        <div className="mt-4 divide-y divide-slate-800/60 border-t border-slate-800/60 pt-2">
          <p className="pb-2 text-[11px] font-medium text-slate-500">Abonelik Geçmişi</p>
          {olaylar.map((o) => (
            <div key={o.id} className="flex items-start gap-2 py-2">
              <span className="text-sm">{OLAY_IKON[o.event_type] ?? "📌"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-300">{o.description}</p>
                <p className="text-[10px] text-slate-500">{new Date(o.created_at).toLocaleString("tr-TR")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
