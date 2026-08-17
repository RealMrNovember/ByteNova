"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Urun = { id: string; name: string; sku: string | null };
export type SecilenKalem = { productId: string; productName: string; quantity: number };

export function UrunEkleSatiri({ onEkle }: { onEkle: (kalem: SecilenKalem) => void }) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState<Urun | null>(null);
  const [miktar, setMiktar] = useState("1");
  const kutuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  useEffect(() => {
    if (arama.trim().length < 2) {
      setSonuclar([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const q = arama.trim();
      const { data } = await supabase
        .from("products")
        .select("id, name, sku")
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
        .eq("is_active", true)
        .eq("is_digital", false)
        .limit(8);
      setSonuclar(data ?? []);
      setAcik(true);
    }, 250);
    return () => clearTimeout(t);
  }, [arama]);

  function ekle() {
    if (!secili) return;
    onEkle({ productId: secili.id, productName: secili.name, quantity: Number(miktar) || 1 });
    setSecili(null);
    setArama("");
    setMiktar("1");
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1" ref={kutuRef}>
        <input
          type="text"
          value={secili ? secili.name : arama}
          onChange={(e) => {
            setSecili(null);
            setArama(e.target.value);
          }}
          onFocus={() => arama.trim().length >= 2 && setAcik(true)}
          placeholder="🔍 Parça ara (ürün adı veya SKU)…"
          className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        {acik && sonuclar.length > 0 && (
          <div className="glass absolute inset-x-0 top-11 z-30 max-h-56 overflow-y-auto rounded-xl p-1.5 shadow-xl">
            {sonuclar.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSecili(u);
                  setAcik(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-nova-500/15"
              >
                <span>{u.name}</span>
                <span className="text-xs text-slate-500">{u.sku}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="number"
        min="1"
        step="1"
        value={miktar}
        onChange={(e) => setMiktar(e.target.value)}
        className="w-16 shrink-0 rounded-lg border border-slate-700 bg-surface px-2 py-2.5 text-center text-sm text-slate-200 outline-none focus:border-nova-500"
      />
      <button
        type="button"
        onClick={ekle}
        disabled={!secili}
        className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Ekle
      </button>
    </div>
  );
}
