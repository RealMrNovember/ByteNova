"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Kategori = { id: string; name: string };

type Props = {
  tenantId: string;
  seciliId: string | null;
  onSec: (id: string | null) => void;
};

export function KategoriSec({ tenantId, seciliId, onSec }: Props) {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [yeniModu, setYeniModu] = useState(false);
  const [yeniAd, setYeniAd] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    createClient()
      .from("product_categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setKategoriler(data ?? []));
  }, []);

  async function kategoriEkle() {
    const ad = yeniAd.trim();
    if (!ad) return;
    setKaydediliyor(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .insert({ tenant_id: tenantId, name: ad })
      .select("id, name")
      .single();
    setKaydediliyor(false);

    if (!error && data) {
      setKategoriler((k) => [...k, data].sort((a, b) => a.name.localeCompare(b.name, "tr")));
      onSec(data.id);
      setYeniModu(false);
      setYeniAd("");
    }
  }

  if (yeniModu) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              kategoriEkle();
            }
          }}
          placeholder="Yeni kategori adı"
          className="flex-1 rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        <button
          type="button"
          onClick={kategoriEkle}
          disabled={kaydediliyor || !yeniAd.trim()}
          className="shrink-0 rounded-lg bg-nova-500 px-3.5 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
        >
          Ekle
        </button>
        <button
          type="button"
          onClick={() => setYeniModu(false)}
          className="shrink-0 rounded-lg border border-slate-700 px-3 py-2.5 text-xs text-slate-300"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={seciliId ?? ""}
        onChange={(e) => onSec(e.target.value || null)}
        className="flex-1 rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-nova-500"
      >
        <option value="">— Kategorisiz —</option>
        {kategoriler.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setYeniModu(true)}
        className="shrink-0 rounded-lg border border-dashed border-slate-700 px-3.5 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-nova-500/50 hover:text-nova-300"
      >
        + Yeni
      </button>
    </div>
  );
}
