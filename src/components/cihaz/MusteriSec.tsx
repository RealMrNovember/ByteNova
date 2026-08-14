"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Musteri = { id: string; name: string; phone: string | null };

type Props = {
  secili: Musteri | null;
  onSec: (m: Musteri | null) => void;
};

export function MusteriSec({ secili, onSec }: Props) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Musteri[]>([]);
  const [acik, setAcik] = useState(false);
  const kutuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={kutuRef}>
      <input
        type="text"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        onFocus={() => arama.trim().length >= 2 && setAcik(true)}
        placeholder="🔍 Müşteri ara (ad veya telefon)…"
        className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
      />
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
          <a href="/panel/musteriler/yeni" className="text-nova-300">
            yeni müşteri oluştur
          </a>
        </div>
      )}
    </div>
  );
}
