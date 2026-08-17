"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TedarikciSec } from "@/components/alis/TedarikciSec";
import { sonrakiDurumlar, DURUM_ETIKETLERI, type CekDurum, type CekYon } from "@/lib/cekSenet";

type KasaHesabi = { id: string; name: string; type: string };
type Tedarikci = { id: string; name: string; currency: string };

type Props = {
  tenantId: string;
  cekId: string;
  yon: CekYon;
  mevcutDurum: CekDurum;
  kasaHesaplari: KasaHesabi[];
};

export function CekSenetIslemi({ tenantId, cekId, yon, mevcutDurum, kasaHesaplari }: Props) {
  const router = useRouter();
  const [acikDurum, setAcikDurum] = useState<CekDurum | null>(null);
  const [kasaId, setKasaId] = useState("");
  const [tedarikci, setTedarikci] = useState<Tedarikci | null>(null);
  const [not, setNot] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function uygula(durum: CekDurum) {
    if ((durum === "tahsil_edildi" || durum === "odendi") && !kasaId) {
      setHata("Kasa hesabı seçin.");
      return;
    }
    if (durum === "ciro_edildi" && !tedarikci) {
      setHata("Ciro edilecek tedarikçiyi seçin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("cek_senet_durum_guncelle", {
      p_id: cekId,
      p_yeni_durum: durum,
      p_account_id: durum === "tahsil_edildi" || durum === "odendi" ? kasaId : null,
      p_hedef_tedarikci_id: durum === "ciro_edildi" ? tedarikci?.id : null,
      p_not: not.trim() || null,
    });
    setKaydediliyor(false);
    if (error) {
      setHata("İşlem yapılamadı.");
      return;
    }
    setAcikDurum(null);
    router.refresh();
  }

  const secenekler = sonrakiDurumlar(yon, mevcutDurum);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {secenekler.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setAcikDurum(acikDurum === d ? null : d);
              setHata(null);
            }}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              acikDurum === d
                ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {DURUM_ETIKETLERI[d]}
          </button>
        ))}
      </div>

      {acikDurum && (
        <div className="mt-2.5 rounded-lg border border-slate-700 bg-surface-2 p-3 space-y-2.5">
          {(acikDurum === "tahsil_edildi" || acikDurum === "odendi") && (
            <select
              value={kasaId}
              onChange={(e) => setKasaId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 outline-none focus:border-nova-500"
            >
              <option value="">Kasa hesabı seçin…</option>
              {kasaHesaplari.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          )}
          {acikDurum === "ciro_edildi" && (
            <TedarikciSec tenantId={tenantId} secili={tedarikci} onSec={setTedarikci} />
          )}
          <input
            type="text"
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Not (opsiyonel)"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          {hata && <p className="text-[11px] text-red-300">{hata}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => uygula(acikDurum)}
              disabled={kaydediliyor}
              className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
            >
              {kaydediliyor ? "Kaydediliyor…" : `${DURUM_ETIKETLERI[acikDurum]} olarak işaretle`}
            </button>
            <button
              type="button"
              onClick={() => setAcikDurum(null)}
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-[11px] text-slate-300"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
