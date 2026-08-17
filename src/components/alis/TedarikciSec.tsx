"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tedarikci = { id: string; name: string; currency: string };

type Props = {
  tenantId: string;
  secili: Tedarikci | null;
  onSec: (t: Tedarikci | null) => void;
};

export function TedarikciSec({ tenantId, secili, onSec }: Props) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Tedarikci[]>([]);
  const [acik, setAcik] = useState(false);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [yeniModu, setYeniModu] = useState(false);
  const [ad, setAd] = useState("");
  const [paraBirimi, setParaBirimi] = useState("TRY");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) {
        setAcik(false);
      }
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  useEffect(() => {
    if (arama.trim().length < 2) {
      setSonuclar([]);
      return;
    }
    const zamanlayici = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("suppliers")
        .select("id, name, currency")
        .ilike("name", `%${arama.trim()}%`)
        .eq("is_active", true)
        .limit(6);
      setSonuclar(data ?? []);
      setAcik(true);
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [arama]);

  function yeniTedarikciModunuAc() {
    if (arama.trim()) setAd(arama.trim());
    setAcik(false);
    setYeniModu(true);
  }

  async function hizliKaydet() {
    if (!ad.trim()) {
      setHata("Tedarikçi adı gerekli.");
      return;
    }
    setHata(null);
    setKaydediliyor(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        tenant_id: tenantId,
        name: ad.trim(),
        currency: paraBirimi,
        created_by: user?.id,
      })
      .select("id, name, currency")
      .single();

    setKaydediliyor(false);

    if (error || !data) {
      setHata("Tedarikçi kaydedilemedi. Lütfen tekrar deneyin.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "tedarikci_olusturuldu",
      p_entity: "supplier",
      p_entity_id: data.id,
      p_new: { name: data.name, kaynak: "hizli_kayit" },
    });

    onSec(data);
    setYeniModu(false);
    setAd("");
    setParaBirimi("TRY");
    setArama("");
  }

  if (secili) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-nova-500/40 bg-nova-500/10 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-nova-200">{secili.name}</p>
          <p className="text-xs text-slate-500">{secili.currency}</p>
        </div>
        <button
          type="button"
          onClick={() => onSec(null)}
          className="ml-3 shrink-0 text-xs text-slate-400 hover:text-red-300"
        >
          ✕ Değiştir
        </button>
      </div>
    );
  }

  if (yeniModu) {
    return (
      <div className="space-y-2.5 rounded-lg border border-slate-700 bg-surface-2 p-3.5">
        <p className="text-[11px] font-medium text-slate-400">
          ⚡ Hızlı tedarikçi kaydı — yalnızca gerekli alanlar
        </p>
        <div className="grid grid-cols-[1fr_100px] gap-2">
          <input
            autoFocus
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Tedarikçi adı *"
            className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          <select
            value={paraBirimi}
            onChange={(e) => setParaBirimi(e.target.value)}
            className="rounded-lg border border-slate-700 bg-surface px-2 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
          >
            <option value="TRY">TL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        {hata && <p className="text-xs text-red-300">{hata}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={hizliKaydet}
            disabled={kaydediliyor || !ad.trim()}
            className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet ve Seç"}
          </button>
          <button
            type="button"
            onClick={() => setYeniModu(false)}
            className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
          >
            Vazgeç
          </button>
        </div>
        <p className="text-[10px] text-slate-600">
          IBAN, telefon ve adres tedarikçi kartından sonra eklenebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="relative" ref={kutuRef}>
      <div className="flex gap-2">
        <input
          type="text"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          onFocus={() => arama.trim().length >= 2 && setAcik(true)}
          placeholder="🔍 Tedarikçi ara…"
          className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
        <button
          type="button"
          onClick={yeniTedarikciModunuAc}
          className="shrink-0 rounded-lg border border-dashed border-slate-700 px-3.5 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-nova-500/50 hover:text-nova-300"
        >
          + Yeni
        </button>
      </div>
      {acik && sonuclar.length > 0 && (
        <div className="glass absolute inset-x-0 top-12 z-30 max-h-56 overflow-y-auto rounded-xl p-1.5 shadow-xl shadow-black/40">
          {sonuclar.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSec(t);
                setAcik(false);
                setArama("");
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-nova-500/15"
            >
              <span>{t.name}</span>
              <span className="text-xs text-slate-500">{t.currency}</span>
            </button>
          ))}
        </div>
      )}
      {acik && arama.trim().length >= 2 && sonuclar.length === 0 && (
        <div className="glass absolute inset-x-0 top-12 z-30 rounded-xl p-3 text-center text-xs text-slate-500 shadow-xl">
          Tedarikçi bulunamadı —{" "}
          <button
            type="button"
            onClick={yeniTedarikciModunuAc}
            className="text-nova-300 hover:text-nova-50"
          >
            hızlıca ekle
          </button>
        </div>
      )}
    </div>
  );
}
