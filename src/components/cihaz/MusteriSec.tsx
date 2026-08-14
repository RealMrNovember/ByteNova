"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Musteri = { id: string; name: string; phone: string | null };

type Props = {
  tenantId: string;
  secili: Musteri | null;
  onSec: (m: Musteri | null) => void;
};

// "0532..." gibi görünüyorsa telefon, aksi halde isim kabul edilir.
function telefonMu(deger: string) {
  const rakamSayisi = (deger.match(/\d/g) ?? []).length;
  return rakamSayisi >= 3 && rakamSayisi >= deger.replace(/\s/g, "").length * 0.5;
}

export function MusteriSec({ tenantId, secili, onSec }: Props) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Musteri[]>([]);
  const [acik, setAcik] = useState(false);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [yeniModu, setYeniModu] = useState(false);
  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
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
      const q = arama.trim();
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone")
        .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
        .eq("is_active", true)
        .limit(6);
      setSonuclar(data ?? []);
      setAcik(true);
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [arama]);

  function yeniMusteriModunuAc() {
    const girilen = arama.trim();
    if (girilen) {
      if (telefonMu(girilen)) setTelefon(girilen);
      else setAd(girilen);
    }
    setAcik(false);
    setYeniModu(true);
  }

  async function hizliKaydet() {
    if (!ad.trim()) {
      setHata("Ad Soyad gerekli.");
      return;
    }
    setHata(null);
    setKaydediliyor(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        type: "individual",
        name: ad.trim(),
        phone: telefon.trim() || null,
        created_by: user?.id,
      })
      .select("id, name, phone")
      .single();

    setKaydediliyor(false);

    if (error || !data) {
      setHata("Müşteri kaydedilemedi. Lütfen tekrar deneyin.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "musteri_olusturuldu",
      p_entity: "customer",
      p_entity_id: data.id,
      p_new: { name: data.name, kaynak: "hizli_kayit" },
    });

    onSec(data);
    setYeniModu(false);
    setAd("");
    setTelefon("");
    setArama("");
  }

  if (secili) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-nova-500/40 bg-nova-500/10 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-nova-200">
            {secili.name}
          </p>
          {secili.phone && (
            <p className="text-xs text-slate-500">{secili.phone}</p>
          )}
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
          ⚡ Hızlı müşteri kaydı — yalnızca gerekli alanlar
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            autoFocus
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Ad Soyad *"
            className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          <input
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="Telefon"
            className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
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
          Adres, vergi bilgisi ve notlar müşteri kartından sonra eklenebilir.
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
          placeholder="🔍 Müşteri ara (ad veya telefon)…"
          className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
        <button
          type="button"
          onClick={yeniMusteriModunuAc}
          className="shrink-0 rounded-lg border border-dashed border-slate-700 px-3.5 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-nova-500/50 hover:text-nova-300"
        >
          + Yeni
        </button>
      </div>
      {acik && sonuclar.length > 0 && (
        <div className="glass absolute inset-x-0 top-12 z-30 max-h-56 overflow-y-auto rounded-xl p-1.5 shadow-xl shadow-black/40">
          {sonuclar.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSec(m);
                setAcik(false);
                setArama("");
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-nova-500/15"
            >
              <span>{m.name}</span>
              <span className="text-xs text-slate-500">{m.phone}</span>
            </button>
          ))}
        </div>
      )}
      {acik && arama.trim().length >= 2 && sonuclar.length === 0 && (
        <div className="glass absolute inset-x-0 top-12 z-30 rounded-xl p-3 text-center text-xs text-slate-500 shadow-xl">
          Müşteri bulunamadı —{" "}
          <button
            type="button"
            onClick={yeniMusteriModunuAc}
            className="text-nova-300 hover:text-nova-50"
          >
            hızlıca ekle
          </button>
        </div>
      )}
    </div>
  );
}
