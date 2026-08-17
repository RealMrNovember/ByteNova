"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";
import { bilesenIkon } from "@/lib/toplama";

type PlanKalemi = {
  id: string;
  component_type: string;
  name: string;
  brand: string | null;
  estimated_price: number;
  quantity: number;
  matched_product_id: string | null;
  matched_product_name: string | null;
};

type UrunSonucu = { id: string; name: string; stock_quantity: number };

function KalemEslestirici({ kalem, onEslesti }: { kalem: PlanKalemi; onEslesti: (productId: string, productName: string) => void }) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<UrunSonucu[]>([]);
  const [acik, setAcik] = useState(false);
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
      const { data } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .eq("component_type", kalem.component_type)
        .eq("is_active", true)
        .ilike("name", `%${arama.trim()}%`)
        .limit(6);
      setSonuclar(data ?? []);
      setAcik(true);
    }, 250);
    return () => clearTimeout(t);
  }, [arama, kalem.component_type]);

  return (
    <div className="relative mt-1.5" ref={kutuRef}>
      <input
        type="text"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        onFocus={() => arama.trim().length >= 2 && setAcik(true)}
        placeholder="🔍 Eşleşecek stok kartını arayın…"
        className="w-full rounded-lg border border-amber-500/30 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-500/60"
      />
      {acik && sonuclar.length > 0 && (
        <div className="glass absolute inset-x-0 top-8 z-20 max-h-44 overflow-y-auto rounded-xl p-1.5 shadow-xl">
          {sonuclar.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onEslesti(u.id, u.name);
                setAcik(false);
                setArama("");
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-nova-500/15"
            >
              <span>{u.name}</span>
              <span className="text-slate-500">{u.stock_quantity} stok</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PcPlaniDetay({ planId, durum, kalemler: ilk }: { planId: string; durum: string; kalemler: PlanKalemi[] }) {
  const router = useRouter();
  const [kalemler, setKalemler] = useState(ilk);
  const [donusturuluyor, setDonusturuluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function esle(kalemId: string, productId: string, productName: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("pc_plani_kalem_esle", { p_plan_item_id: kalemId, p_product_id: productId });
    if (!error) {
      setKalemler((k) => k.map((x) => (x.id === kalemId ? { ...x, matched_product_id: productId, matched_product_name: productName } : x)));
    }
  }

  async function donustur() {
    setDonusturuluyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("pc_plani_toplama_emrine_donustur", { p_plan_id: planId });
    setDonusturuluyor(false);
    if (error || !data) {
      setHata("Dönüştürülemedi — tüm kalemlerin eşleştiğinden emin olun.");
      return;
    }
    router.push(`/panel/pc-toplama/${data}`);
    router.refresh();
  }

  const hepsiEslesti = kalemler.every((k) => k.matched_product_id);

  if (durum !== "taslak") return null;

  return (
    <div className="glass mt-4 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Toplama Emrine Dönüştür</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Her kalemi gerçek bir stok kartıyla eşleştirin — ancak o zaman stoktan düşülebilir.
      </p>

      <div className="mt-3 space-y-2.5">
        {kalemler.map((k) => (
          <div key={k.id} className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300">
                {bilesenIkon(k.component_type)} {k.name} <span className="text-slate-500">× {k.quantity}</span>
              </span>
              {k.matched_product_id ? (
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  ✓ {k.matched_product_name}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  Eşleşmedi
                </span>
              )}
            </div>
            {!k.matched_product_id && <KalemEslestirici kalem={k} onEslesti={(pid, pname) => esle(k.id, pid, pname)} />}
          </div>
        ))}
      </div>

      {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}

      <button
        type="button"
        onClick={donustur}
        disabled={!hepsiEslesti || donusturuluyor}
        className="mt-4 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {donusturuluyor ? "Dönüştürülüyor…" : "✓ Toplama Emrine Dönüştür"}
      </button>
    </div>
  );
}
