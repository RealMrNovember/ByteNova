"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { talepDurumEtiket, talepDurumSinifi, talepKaynakEtiket, talepKaynakIkon } from "@/lib/talep";

type Urun = { id: string; name: string; stock_quantity: number };
export type Talep = {
  id: string;
  quantity: number;
  source: string;
  status: string;
  note: string | null;
  requested_at: string;
  products: { id: string; name: string } | null;
  service_orders: { id: string; service_no: string } | null;
};

type Props = {
  yetkili: boolean;
  talepler: Talep[];
};

export function TalepYonetimi({ yetkili, talepler: ilk }: Props) {
  const router = useRouter();
  const [talepler, setTalepler] = useState(ilk);
  const [formAcik, setFormAcik] = useState(false);

  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [sonucAcik, setSonucAcik] = useState(false);
  const [secili, setSecili] = useState<Urun | null>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [miktar, setMiktar] = useState("1");
  const [not, setNot] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemdeki, setIslemdeki] = useState<string | null>(null);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setSonucAcik(false);
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
        .ilike("name", `%${arama.trim()}%`)
        .eq("is_active", true)
        .limit(6);
      setSonuclar(data ?? []);
      setSonucAcik(true);
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
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("satin_alma_talebi_olustur", {
      p_product_id: secili.id,
      p_miktar: adet,
      p_kaynak: "manuel",
      p_servis_id: null,
      p_not: not.trim() || null,
    });

    setKaydediliyor(false);
    if (error) {
      setHata("Talep oluşturulamadı.");
      return;
    }

    setSecili(null);
    setArama("");
    setMiktar("1");
    setNot("");
    setFormAcik(false);
    router.refresh();
  }

  async function iptalEt(id: string) {
    setIslemdeki(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("satin_alma_talebi_iptal", { p_id: id });
    setIslemdeki(null);
    if (!error) {
      setTalepler((t) => t.map((x) => (x.id === id ? { ...x, status: "iptal" } : x)));
    }
  }

  return (
    <div>
      {yetkili && (
        <div className="mb-4">
          {!formAcik ? (
            <button
              onClick={() => setFormAcik(true)}
              className="rounded-lg border border-dashed border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-nova-500/50 hover:text-nova-300"
            >
              + Yeni Talep
            </button>
          ) : (
            <div className="glass space-y-2.5 rounded-xl p-4">
              <div className="relative" ref={kutuRef}>
                {secili ? (
                  <div className="flex items-center justify-between rounded-lg border border-nova-500/40 bg-nova-500/10 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-nova-200">{secili.name}</p>
                      <p className="text-xs text-slate-500">Stokta: {secili.stock_quantity}</p>
                    </div>
                    <button onClick={() => setSecili(null)} className="ml-2 shrink-0 text-xs text-slate-400 hover:text-red-300">
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={arama}
                      onChange={(e) => setArama(e.target.value)}
                      onFocus={() => arama.trim().length >= 2 && setSonucAcik(true)}
                      placeholder="🔍 Ürün ara…"
                      className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
                    />
                    {sonucAcik && sonuclar.length > 0 && (
                      <div className="glass absolute inset-x-0 top-12 z-30 max-h-56 overflow-y-auto rounded-xl p-1.5 shadow-xl">
                        {sonuclar.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSecili(u);
                              setSonucAcik(false);
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
              <div className="flex gap-2">
                <button
                  onClick={talepOlustur}
                  disabled={!secili || kaydediliyor}
                  className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {kaydediliyor ? "Oluşturuluyor…" : "Talep Oluştur"}
                </button>
                <button
                  onClick={() => setFormAcik(false)}
                  className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!talepler.length ? (
        <div className="glass flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">📋</span>
          <h2 className="mt-4 font-semibold text-white">Açık talep yok</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            Servisten "Parça Talebi" oluşturulduğunda veya bir ürün kritik stoğa düştüğünde talepler burada listelenir.
          </p>
        </div>
      ) : (
        <div className="glass divide-y divide-slate-800/60 overflow-hidden rounded-xl">
          {talepler.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="text-base">{talepKaynakIkon(t.source)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">
                  {t.products?.name ?? "Silinmiş ürün"} <span className="text-slate-500">× {t.quantity}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {talepKaynakEtiket(t.source)}
                  {t.service_orders && (
                    <>
                      {" · "}
                      <Link href={`/panel/servisler/${t.service_orders.id}`} className="hover:text-nova-300">
                        {t.service_orders.service_no}
                      </Link>
                    </>
                  )}
                  {t.note && ` · ${t.note}`}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${talepDurumSinifi(t.status)}`}>
                {talepDurumEtiket(t.status)}
              </span>
              {yetkili && (t.status === "bekliyor" || t.status === "siparis_edildi") && t.products && (
                <div className="flex shrink-0 gap-1.5">
                  <Link
                    href={`/panel/alis/yeni?urun=${t.products.id}&miktar=${t.quantity}`}
                    className="rounded-lg bg-nova-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-nova-400"
                  >
                    + Alış Oluştur
                  </Link>
                  <button
                    onClick={() => iptalEt(t.id)}
                    disabled={islemdeki === t.id}
                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:border-red-500/40 hover:text-red-300"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
