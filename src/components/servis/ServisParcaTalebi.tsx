"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { talepDurumEtiket, talepDurumSinifi } from "@/lib/talep";

type Urun = { id: string; name: string; stock_quantity: number };
type Talep = {
  id: string;
  quantity: number;
  status: string;
  note: string | null;
  requested_at: string;
  products: { name: string } | null;
};

type Props = {
  servisId: string;
  yetkili: boolean;
  talepler: Talep[];
};

export function ServisParcaTalebi({ servisId, yetkili, talepler: ilk }: Props) {
  const router = useRouter();
  const [talepler, setTalepler] = useState(ilk);

  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState<Urun | null>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [miktar, setMiktar] = useState("1");
  const [not, setNot] = useState("");
  const [ekleniyor, setEkleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

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
        .select("id, name, stock_quantity")
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`)
        .eq("is_active", true)
        .limit(6);
      setSonuclar(data ?? []);
      setAcik(true);
    }, 250);
    return () => clearTimeout(t);
  }, [arama]);

  async function talepOlustur() {
    if (!secili) return;
    const adet = Number(miktar) || 0;
    if (adet <= 0) {
      setHata("Geçerli bir miktar girin.");
      return;
    }
    setEkleniyor(true);
    setHata(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("satin_alma_talebi_olustur", {
      p_product_id: secili.id,
      p_miktar: adet,
      p_kaynak: "servis",
      p_servis_id: servisId,
      p_not: not.trim() || null,
    });

    setEkleniyor(false);
    if (error || !data) {
      setHata("Talep oluşturulamadı.");
      return;
    }

    setTalepler((t) => [
      {
        id: data as string,
        quantity: adet,
        status: "bekliyor",
        note: not.trim() || null,
        requested_at: new Date().toISOString(),
        products: { name: secili.name },
      },
      ...t,
    ]);
    setSecili(null);
    setArama("");
    setMiktar("1");
    setNot("");
    router.refresh();
  }

  if (!yetkili && !talepler.length) return null;

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Parça Talebi</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Elde olmayan bir parçaya ihtiyacınız varsa talep oluşturun — satın alma ekibi Alış'tan girdiğinde otomatik olarak buraya bildirim düşer.
      </p>

      {yetkili && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-slate-800 bg-surface-2 p-3.5">
          <div className="relative" ref={kutuRef}>
            {secili ? (
              <div className="flex items-center justify-between rounded-lg border border-nova-500/40 bg-nova-500/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-nova-200">{secili.name}</p>
                  <p className="text-xs text-slate-500">Stokta: {secili.stock_quantity}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSecili(null)}
                  className="ml-2 shrink-0 text-xs text-slate-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  onFocus={() => arama.trim().length >= 2 && setAcik(true)}
                  placeholder="🔍 Parça ara (ad, SKU, barkod)…"
                  className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
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
                          setArama("");
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-nova-500/15"
                      >
                        <span>{u.name}</span>
                        <span className="text-xs text-slate-500">Stok: {u.stock_quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Miktar</label>
            <input
              type="number"
              step="1"
              min="1"
              value={miktar}
              onChange={(e) => setMiktar(e.target.value)}
              className="w-20 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
          </div>

          <input
            type="text"
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Not (opsiyonel)"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />

          {hata && <p className="text-xs text-red-300">{hata}</p>}

          <button
            onClick={talepOlustur}
            disabled={!secili || ekleniyor}
            className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ekleniyor ? "Oluşturuluyor…" : "+ Talep Oluştur"}
          </button>
        </div>
      )}

      {talepler.length === 0 ? (
        <p className="mt-4 text-center text-xs text-slate-600">Henüz parça talebi yok.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {talepler.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-200">
                  {t.products?.name ?? "Silinmiş ürün"} <span className="text-slate-500">× {t.quantity}</span>
                </p>
                {t.note && <p className="mt-0.5 text-[11px] text-slate-500">{t.note}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${talepDurumSinifi(t.status)}`}>
                {talepDurumEtiket(t.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
