"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { paraFormatla } from "@/lib/doviz";
import { tenantDurum } from "@/lib/konsol";
import {
  tenantUzat,
  tenantDurumDegistir,
  tenantPlanDegistir,
  dekontOnayla,
  dekontReddet,
} from "@/app/konsol/(app)/[id]/actions";

type Plan = { id: string; key: string; name: string; monthly_price: number; yearly_price: number };
type Dekont = {
  id: string;
  amount: number | null;
  note: string | null;
  status: "bekliyor" | "onaylandi" | "reddedildi";
  review_note: string | null;
  created_at: string;
};

const DEKONT_DURUM: Record<string, { ad: string; sinif: string }> = {
  bekliyor: { ad: "İnceleniyor", sinif: "bg-amber-500/15 text-amber-300" },
  onaylandi: { ad: "Onaylandı", sinif: "bg-emerald-500/15 text-emerald-300" },
  reddedildi: { ad: "Reddedildi", sinif: "bg-red-500/15 text-red-300" },
};

type Props = {
  tenantId: string;
  status: string;
  trialEndsAt: string | null;
  plan: Plan | null;
  billingCycle: "aylik" | "yillik" | null;
  planlar: Plan[];
  dekontlar: Dekont[];
  platformRol: string;
};

export function AbonelikYonetimi({
  tenantId,
  status,
  trialEndsAt,
  plan,
  billingCycle,
  planlar,
  dekontlar,
  platformRol,
}: Props) {
  const router = useRouter();
  const durum = tenantDurum(status);

  const uzatmaYetkisi = ["master", "manager"].includes(platformRol);
  const planYetkisi = ["master", "manager", "finance"].includes(platformRol);
  const dekontYetkisi = ["master", "finance"].includes(platformRol);

  const [uzatBitis, setUzatBitis] = useState("");
  const [uzatGerekce, setUzatGerekce] = useState("");
  const [uzatiliyor, setUzatiliyor] = useState(false);
  const [uzatHata, setUzatHata] = useState<string | null>(null);

  const [askiGerekce, setAskiGerekce] = useState("");
  const [askiFormAcik, setAskiFormAcik] = useState(false);
  const [durumIsleniyor, setDurumIsleniyor] = useState(false);
  const [durumHata, setDurumHata] = useState<string | null>(null);

  const [seciliPlanId, setSeciliPlanId] = useState(plan?.id ?? planlar[0]?.id ?? "");
  const [seciliDonem, setSeciliDonem] = useState<"aylik" | "yillik">(billingCycle ?? "aylik");
  const [planGerekce, setPlanGerekce] = useState("");
  const [planIsleniyor, setPlanIsleniyor] = useState(false);
  const [planHata, setPlanHata] = useState<string | null>(null);

  const [redGerekceleri, setRedGerekceleri] = useState<Record<string, string>>({});
  const [dekontIsleniyor, setDekontIsleniyor] = useState<string | null>(null);
  const [dekontHata, setDekontHata] = useState<string | null>(null);

  async function uzat() {
    setUzatiliyor(true);
    setUzatHata(null);
    const sonuc = await tenantUzat(tenantId, uzatBitis, uzatGerekce);
    setUzatiliyor(false);
    if (!sonuc.ok) {
      setUzatHata(sonuc.hata);
      return;
    }
    setUzatBitis("");
    setUzatGerekce("");
    router.refresh();
  }

  async function durumDegistir(yeni: "active" | "suspended") {
    setDurumIsleniyor(true);
    setDurumHata(null);
    const sonuc = await tenantDurumDegistir(tenantId, yeni, askiGerekce);
    setDurumIsleniyor(false);
    if (!sonuc.ok) {
      setDurumHata(sonuc.hata);
      return;
    }
    setAskiGerekce("");
    setAskiFormAcik(false);
    router.refresh();
  }

  async function planDegistir() {
    setPlanIsleniyor(true);
    setPlanHata(null);
    const sonuc = await tenantPlanDegistir(tenantId, seciliPlanId, seciliDonem, planGerekce);
    setPlanIsleniyor(false);
    if (!sonuc.ok) {
      setPlanHata(sonuc.hata);
      return;
    }
    setPlanGerekce("");
    router.refresh();
  }

  async function onayla(receiptId: string) {
    setDekontIsleniyor(receiptId);
    setDekontHata(null);
    const sonuc = await dekontOnayla(receiptId, tenantId);
    setDekontIsleniyor(null);
    if (!sonuc.ok) {
      setDekontHata(sonuc.hata);
      return;
    }
    router.refresh();
  }

  async function reddet(receiptId: string) {
    const gerekce = redGerekceleri[receiptId] ?? "";
    setDekontIsleniyor(receiptId);
    setDekontHata(null);
    const sonuc = await dekontReddet(receiptId, tenantId, gerekce);
    setDekontIsleniyor(null);
    if (!sonuc.ok) {
      setDekontHata(sonuc.hata);
      return;
    }
    router.refresh();
  }

  return (
    <div className="glass mt-4 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Abonelik Yönetimi</h2>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durum.sinif}`}>{durum.etiket}</span>
      </div>

      {plan && (
        <p className="mt-2 text-xs text-slate-400">
          {plan.name} · {billingCycle === "yillik" ? "Yıllık" : "Aylık"} ·{" "}
          {paraFormatla(billingCycle === "yillik" ? plan.yearly_price : plan.monthly_price)}
          {trialEndsAt && ` · Bitiş: ${new Date(trialEndsAt).toLocaleDateString("tr-TR")}`}
        </p>
      )}

      {uzatmaYetkisi && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-xs font-medium text-slate-300">Süreyi Uzat</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <input
              type="date"
              value={uzatBitis}
              onChange={(e) => setUzatBitis(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500"
            />
            <input
              type="text"
              value={uzatGerekce}
              onChange={(e) => setUzatGerekce(e.target.value)}
              placeholder="Gerekçe (zorunlu)"
              className="min-w-[180px] flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500"
            />
            <button
              onClick={uzat}
              disabled={uzatiliyor || !uzatBitis || !uzatGerekce.trim()}
              className="rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              {uzatiliyor ? "…" : "Uzat"}
            </button>
          </div>
          {uzatHata && <p className="mt-1.5 text-xs text-red-300">{uzatHata}</p>}
        </div>
      )}

      {uzatmaYetkisi && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-xs font-medium text-slate-300">Durum</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {status !== "suspended" ? (
              !askiFormAcik ? (
                <button
                  onClick={() => setAskiFormAcik(true)}
                  className="rounded-lg border border-red-600/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
                >
                  ⏸️ Askıya Al
                </button>
              ) : (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={askiGerekce}
                    onChange={(e) => setAskiGerekce(e.target.value)}
                    placeholder="Askıya alma gerekçesi (zorunlu)"
                    className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500"
                  />
                  <button
                    onClick={() => durumDegistir("suspended")}
                    disabled={durumIsleniyor || !askiGerekce.trim()}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => setAskiFormAcik(false)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                  >
                    Vazgeç
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => durumDegistir("active")}
                disabled={durumIsleniyor}
                className="rounded-lg border border-emerald-600/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                ▶️ Yeniden Etkinleştir
              </button>
            )}
          </div>
          {durumHata && <p className="mt-1.5 text-xs text-red-300">{durumHata}</p>}
        </div>
      )}

      {planYetkisi && planlar.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-xs font-medium text-slate-300">Plan Değiştir</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <select
              value={seciliPlanId}
              onChange={(e) => setSeciliPlanId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500"
            >
              {planlar.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={seciliDonem}
              onChange={(e) => setSeciliDonem(e.target.value as "aylik" | "yillik")}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500"
            >
              <option value="aylik">Aylık</option>
              <option value="yillik">Yıllık</option>
            </select>
            <input
              type="text"
              value={planGerekce}
              onChange={(e) => setPlanGerekce(e.target.value)}
              placeholder="Gerekçe (zorunlu)"
              className="min-w-[160px] flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500"
            />
            <button
              onClick={planDegistir}
              disabled={planIsleniyor || !planGerekce.trim() || !seciliPlanId}
              className="rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              {planIsleniyor ? "…" : "Değiştir"}
            </button>
          </div>
          {planHata && <p className="mt-1.5 text-xs text-red-300">{planHata}</p>}
        </div>
      )}

      {dekontlar.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-xs font-medium text-slate-300">Ödeme Dekontları</p>
          <div className="mt-2 space-y-2">
            {dekontlar.map((d) => {
              const dd = DEKONT_DURUM[d.status];
              return (
                <div key={d.id} className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/api/konsol/dekont/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-nova-300 hover:underline"
                    >
                      📎 Dekontu Görüntüle
                    </a>
                    {d.amount != null && <span className="text-xs text-slate-400">{paraFormatla(d.amount)}</span>}
                    <span className="text-[11px] text-slate-500">
                      {new Date(d.created_at).toLocaleDateString("tr-TR")}
                    </span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${dd.sinif}`}>
                      {dd.ad}
                    </span>
                  </div>
                  {d.note && <p className="mt-1 text-[11px] text-slate-500">Not: {d.note}</p>}
                  {d.status !== "bekliyor" && d.review_note && (
                    <p className="mt-1 text-[11px] text-slate-500">İnceleme notu: {d.review_note}</p>
                  )}
                  {d.status === "bekliyor" && dekontYetkisi && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onayla(d.id)}
                        disabled={dekontIsleniyor === d.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Onayla
                      </button>
                      <input
                        type="text"
                        value={redGerekceleri[d.id] ?? ""}
                        onChange={(e) => setRedGerekceleri((s) => ({ ...s, [d.id]: e.target.value }))}
                        placeholder="Red gerekçesi"
                        className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-surface-2 px-2.5 py-1 text-[11px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-500"
                      />
                      <button
                        onClick={() => reddet(d.id)}
                        disabled={dekontIsleniyor === d.id || !(redGerekceleri[d.id] ?? "").trim()}
                        className="rounded-lg border border-red-600/40 px-3 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {dekontHata && <p className="mt-1.5 text-xs text-red-300">{dekontHata}</p>}
        </div>
      )}
    </div>
  );
}
