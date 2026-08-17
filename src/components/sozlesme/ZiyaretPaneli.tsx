"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Teknisyen = { id: string; full_name: string | null };

type Props = {
  visitId: string;
  teknisyenler: Teknisyen[];
  atanmisTeknisyen: string | null;
};

export function ZiyaretPaneli({ visitId, teknisyenler, atanmisTeknisyen }: Props) {
  const router = useRouter();
  const [teknisyenId, setTeknisyenId] = useState(atanmisTeknisyen ?? "");
  const [rapor, setRapor] = useState("");
  const [kapsamDisi, setKapsamDisi] = useState(false);
  const [formAcik, setFormAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const alanSinifi =
    "w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 outline-none transition-colors focus:border-nova-500";

  async function teknisyenAta() {
    if (!teknisyenId) return;
    setYukleniyor(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("sozlesme_ziyaret_teknisyen_ata", {
      p_visit_id: visitId,
      p_teknisyen_id: teknisyenId,
    });
    setYukleniyor(false);
    if (error) {
      setHata("Teknisyen atanamadı.");
      return;
    }
    router.refresh();
  }

  async function tamamla() {
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("sozlesme_ziyaret_tamamla", {
      p_visit_id: visitId,
      p_rapor: rapor.trim() || null,
      p_kapsam_disi: kapsamDisi,
    });
    setYukleniyor(false);
    if (error) {
      setHata("Ziyaret tamamlanamadı.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        value={teknisyenId}
        onChange={(e) => setTeknisyenId(e.target.value)}
        className="rounded-lg border border-slate-700 bg-surface px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-nova-500"
      >
        <option value="">— Teknisyen Seç —</option>
        {teknisyenler.map((t) => (
          <option key={t.id} value={t.id}>
            {t.full_name ?? "İsimsiz"}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={teknisyenAta}
        disabled={yukleniyor || !teknisyenId}
        className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-nova-500/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ata
      </button>

      {formAcik ? (
        <div className="mt-2 w-full space-y-2 rounded-lg border border-slate-800 bg-surface-2 p-3">
          <textarea
            rows={2}
            value={rapor}
            onChange={(e) => setRapor(e.target.value)}
            placeholder="Ziyaret raporu…"
            className={`${alanSinifi} resize-none`}
          />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={kapsamDisi}
              onChange={(e) => setKapsamDisi(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0"
            />
            Kapsam dışı iş yapıldı (ayrı ücretli servise dönüşür)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={tamamla}
              disabled={yukleniyor}
              className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {yukleniyor ? "Kaydediliyor…" : "Ziyareti Tamamla"}
            </button>
            <button type="button" onClick={() => setFormAcik(false)} className="text-xs text-slate-500 hover:text-slate-300">
              Vazgeç
            </button>
          </div>
          {kapsamDisi && (
            <p className="text-[11px] text-amber-300">
              Kapsam dışı işin ücretli servis kaydını Servisler → Yeni Servis Kabul'den ayrıca
              oluşturmanız gerekir.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFormAcik(true)}
          className="rounded-lg border border-emerald-600/40 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
        >
          ✓ Ziyareti Tamamla
        </button>
      )}

      {hata && <p className="w-full text-xs text-red-300">{hata}</p>}
    </div>
  );
}
