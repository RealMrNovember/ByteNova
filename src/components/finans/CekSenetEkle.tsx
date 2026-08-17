"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { TedarikciSec } from "@/components/alis/TedarikciSec";
import type { CekTip, CekYon } from "@/lib/cekSenet";

type Musteri = { id: string; name: string; phone: string | null };
type Tedarikci = { id: string; name: string; currency: string };

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function CekSenetEkle({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [tip, setTip] = useState<CekTip>("cek");
  const [yon, setYon] = useState<CekYon>("alinan");
  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [tedarikci, setTedarikci] = useState<Tedarikci | null>(null);
  const [partyName, setPartyName] = useState("");
  const [bankaAdi, setBankaAdi] = useState("");
  const [subeAdi, setSubeAdi] = useState("");
  const [belgeNo, setBelgeNo] = useState("");
  const [vade, setVade] = useState("");
  const [tutar, setTutar] = useState("");
  const [notlar, setNotlar] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function sifirla() {
    setTip("cek");
    setYon("alinan");
    setMusteri(null);
    setTedarikci(null);
    setPartyName("");
    setBankaAdi("");
    setSubeAdi("");
    setBelgeNo("");
    setVade("");
    setTutar("");
    setNotlar("");
    setHata(null);
  }

  async function kaydet() {
    const ad = yon === "alinan" ? musteri?.name || partyName.trim() : tedarikci?.name || partyName.trim();
    if (!ad) {
      setHata("Keşideci / lehtar adı gerekli.");
      return;
    }
    if (!vade) {
      setHata("Vade tarihi gerekli.");
      return;
    }
    const tutarSayi = Number(tutar);
    if (!tutarSayi || tutarSayi <= 0) {
      setHata("Geçerli bir tutar girin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("cek_senet_olustur", {
      p_instrument_type: tip,
      p_direction: yon,
      p_party_name: ad,
      p_due_date: vade,
      p_amount: tutarSayi,
      p_customer_id: yon === "alinan" ? musteri?.id ?? null : null,
      p_supplier_id: yon === "verilen" ? tedarikci?.id ?? null : null,
      p_bank_name: bankaAdi.trim() || null,
      p_branch_name: subeAdi.trim() || null,
      p_cheque_no: belgeNo.trim() || null,
      p_notes: notlar.trim() || null,
    });
    setKaydediliyor(false);
    if (error) {
      setHata("Kaydedilemedi.");
      return;
    }
    sifirla();
    setAcik(false);
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
      >
        + Yeni Çek/Senet
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <p className="text-sm font-medium text-white">Yeni Çek/Senet</p>

      <div className="mt-4 flex gap-2">
        {(["cek", "senet"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTip(t)}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              tip === t ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-400"
            }`}
          >
            {t === "cek" ? "Çek" : "Senet"}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        {(["alinan", "verilen"] as const).map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => {
              setYon(y);
              setMusteri(null);
              setTedarikci(null);
              setPartyName("");
            }}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              yon === y ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-400"
            }`}
          >
            {y === "alinan" ? "Alınan (müşteriden)" : "Verilen (tedarikçiye)"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            {yon === "alinan" ? "Keşideci (müşteri seçebilir veya elle yazabilirsiniz)" : "Lehtar (tedarikçi seçebilir veya elle yazabilirsiniz)"}
          </label>
          {yon === "alinan" ? (
            <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
          ) : (
            <TedarikciSec tenantId={tenantId} secili={tedarikci} onSec={setTedarikci} />
          )}
          {!musteri && !tedarikci && (
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Ya da doğrudan ad yazın"
              className={`${alanSinifi} mt-2`}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Vade tarihi *</label>
            <input type="date" value={vade} onChange={(e) => setVade(e.target.value)} className={alanSinifi} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Tutar (TL) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              placeholder="0.00"
              className={alanSinifi}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Banka</label>
            <input type="text" value={bankaAdi} onChange={(e) => setBankaAdi(e.target.value)} className={alanSinifi} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Şube</label>
            <input type="text" value={subeAdi} onChange={(e) => setSubeAdi(e.target.value)} className={alanSinifi} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Belge no</label>
            <input type="text" value={belgeNo} onChange={(e) => setBelgeNo(e.target.value)} className={alanSinifi} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Notlar</label>
          <textarea rows={2} value={notlar} onChange={(e) => setNotlar(e.target.value)} className={`${alanSinifi} resize-none`} />
        </div>

        {hata && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={kaydet}
            disabled={kaydediliyor}
            className="rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => {
              sifirla();
              setAcik(false);
            }}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
