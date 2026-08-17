"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UyumluUrun = { linkId: string; id: string; name: string; stock_quantity: number; sale_price: number | null };
type AramaSonucu = { id: string; name: string; stock_quantity: number; sale_price: number | null };

type Props = {
  tenantId: string;
  productId: string;
  yetkili: boolean;
  uyumlular: UyumluUrun[];
};

export function UyumluParcalar({ tenantId, productId, yetkili, uyumlular: ilk }: Props) {
  const router = useRouter();
  const [uyumlular, setUyumlular] = useState(ilk);
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<AramaSonucu[]>([]);
  const [acik, setAcik] = useState(false);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [silinenId, setSilinenId] = useState<string | null>(null);
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
        .select("id, name, stock_quantity, sale_price")
        .ilike("name", `%${arama.trim()}%`)
        .eq("is_active", true)
        .neq("id", productId)
        .limit(6);
      setSonuclar((data ?? []).filter((u) => !uyumlular.some((x) => x.id === u.id)));
      setAcik(true);
    }, 250);
    return () => clearTimeout(t);
  }, [arama, productId, uyumlular]);

  async function ekle(urun: AramaSonucu) {
    setEkleniyor(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("product_compatibilities")
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        compatible_product_id: urun.id,
        created_by: user?.id,
      })
      .select("id")
      .single();
    setEkleniyor(false);
    setArama("");
    setAcik(false);
    if (!error && data) {
      setUyumlular((u) => [...u, { linkId: data.id, ...urun }]);
      router.refresh();
    }
  }

  async function kaldir(linkId: string) {
    setSilinenId(linkId);
    const supabase = createClient();
    const { error } = await supabase.from("product_compatibilities").delete().eq("id", linkId);
    setSilinenId(null);
    if (!error) {
      setUyumlular((u) => u.filter((x) => x.linkId !== linkId));
      router.refresh();
    }
  }

  return (
    <div className="glass mt-4 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">🔄 Uyumlu Parçalar</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Bu ürünün yerine kullanılabilecek muadil ürünler — servis ekranında parça stokta yoksa
        burada tanımladığınız alternatifler önerilir.
      </p>

      {yetkili && (
        <div className="relative mt-3" ref={kutuRef}>
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            onFocus={() => arama.trim().length >= 2 && setAcik(true)}
            placeholder="🔍 Muadil ürün ara…"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          {acik && sonuclar.length > 0 && (
            <div className="glass absolute inset-x-0 top-11 z-30 max-h-56 overflow-y-auto rounded-xl p-1.5 shadow-xl">
              {sonuclar.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={ekleniyor}
                  onClick={() => ekle(u)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-nova-500/15"
                >
                  <span>{u.name}</span>
                  <span className="text-xs text-slate-500">Stok: {u.stock_quantity}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!uyumlular.length ? (
        <p className="mt-3 text-center text-xs text-slate-600">Henüz muadil parça tanımlanmadı.</p>
      ) : (
        <div className="mt-3 divide-y divide-slate-800/60 rounded-lg border border-slate-800">
          {uyumlular.map((u) => (
            <div key={u.linkId} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <Link href={`/panel/stok/${u.id}`} className="min-w-0 flex-1 truncate text-sm text-nova-300 hover:text-nova-100">
                {u.name}
              </Link>
              <span
                className={`shrink-0 text-xs ${u.stock_quantity > 0 ? "text-slate-500" : "text-red-400"}`}
              >
                Stok: {u.stock_quantity}
              </span>
              {yetkili && (
                <button
                  type="button"
                  onClick={() => kaldir(u.linkId)}
                  disabled={silinenId === u.linkId}
                  className="shrink-0 text-xs text-slate-500 hover:text-red-300"
                >
                  Kaldır
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
