"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PosHesabi = { id: string; name: string };

export function PosMutabakati({ posHesaplari }: { posHesaplari: PosHesabi[] }) {
  const router = useRouter();
  const [hesapId, setHesapId] = useState(posHesaplari[0]?.id ?? "");
  const [tarih, setTarih] = useState(() => new Date().toISOString().slice(0, 10));
  const [alinanTutar, setAlinanTutar] = useState("");
  const [notlar, setNotlar] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<{ beklenen: number; alinan: number; komisyon: number } | null>(null);

  async function mutabakatYap() {
    if (!hesapId) {
      setHata("POS hesabı seçin.");
      return;
    }
    if (!alinanTutar) {
      setHata("Bankadan gelen tutarı girin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    setSonuc(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("pos_mutabakat_yap", {
      p_cash_account_id: hesapId,
      p_settlement_date: tarih,
      p_received_amount: Number(alinanTutar),
      p_notes: notlar.trim() || null,
    });
    setKaydediliyor(false);
    if (error || !data) {
      setHata(
        error?.message.includes("duplicate") || error?.code === "23505"
          ? "Bu hesap ve tarih için mutabakat zaten yapılmış."
          : "Mutabakat yapılamadı."
      );
      return;
    }
    const supabase2 = createClient();
    const { data: kayit } = await supabase2
      .from("pos_settlements")
      .select("expected_amount, received_amount, commission_amount")
      .eq("id", data)
      .single();
    if (kayit) {
      setSonuc({
        beklenen: kayit.expected_amount,
        alinan: kayit.received_amount,
        komisyon: kayit.commission_amount,
      });
    }
    setAlinanTutar("");
    setNotlar("");
    router.refresh();
  }

  const alanSinifi =
    "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

  return (
    <div className="glass rounded-xl p-5">
      <p className="text-sm font-medium text-white">Yeni Mutabakat</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Sistemdeki o günkü kart tahsilatı toplamı otomatik hesaplanır — siz yalnızca bankadan
        gerçekte geçen tutarı girersiniz, fark komisyon gideri olarak otomatik işlenir.
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">POS Hesabı</label>
            <select value={hesapId} onChange={(e) => setHesapId(e.target.value)} className={alanSinifi}>
              {posHesaplari.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Satış Tarihi</label>
            <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className={alanSinifi} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Bankadan Geçen Tutar (TL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={alinanTutar}
            onChange={(e) => setAlinanTutar(e.target.value)}
            placeholder="0.00"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Notlar</label>
          <input type="text" value={notlar} onChange={(e) => setNotlar(e.target.value)} className={alanSinifi} />
        </div>

        {hata && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
        )}
        {sonuc && (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            ✓ Beklenen: {sonuc.beklenen.toLocaleString("tr-TR")} ₺ · Alınan:{" "}
            {sonuc.alinan.toLocaleString("tr-TR")} ₺ · Komisyon:{" "}
            {sonuc.komisyon.toLocaleString("tr-TR")} ₺
            {sonuc.komisyon > 0 && " (gider olarak kaydedildi)"}
          </div>
        )}

        <button
          type="button"
          onClick={mutabakatYap}
          disabled={kaydediliyor || !posHesaplari.length}
          className="rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Mutabakatı Kaydet"}
        </button>
      </div>
    </div>
  );
}
