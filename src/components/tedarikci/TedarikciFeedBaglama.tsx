"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sandboxKatalogCek, TOPTANCI_SAGLAYICILAR, type ToptanciSaglayici } from "@/lib/tedarikciFeed";

type Feed = {
  id: string;
  provider_key: ToptanciSaglayici;
  status: "aktif" | "pasif";
  last_synced_at: string | null;
  last_sync_item_count: number | null;
};

type Props = {
  tenantId: string;
  supplierId: string;
  feed: Feed | null;
  yetkili: boolean;
};

export function TedarikciFeedBaglama({ tenantId, supplierId, feed, yetkili }: Props) {
  const router = useRouter();
  const [saglayici, setSaglayici] = useState<ToptanciSaglayici>("penta");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<string | null>(null);

  async function baglan() {
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("supplier_feeds").insert({
      tenant_id: tenantId,
      supplier_id: supplierId,
      provider_key: saglayici,
      created_by: user?.id,
    });
    setYukleniyor(false);
    if (error) {
      setHata("Bağlanamadı.");
      return;
    }
    router.refresh();
  }

  async function senkronizeEt() {
    if (!feed) return;
    setYukleniyor(true);
    setHata(null);
    setSonuc(null);
    const supabase = createClient();
    const kalemler = await sandboxKatalogCek(feed.provider_key);
    const { data, error } = await supabase.rpc("toptanci_feed_kalemleri_yukle", {
      p_feed_id: feed.id,
      p_kalemler: kalemler,
    });
    setYukleniyor(false);
    if (error) {
      setHata("Senkronizasyon başarısız.");
      return;
    }
    setSonuc(`${data.toplam_kalem} kalem çekildi, ${data.eslesen_kalem} tanesi stoktaki ürünle eşleşti.`);
    router.refresh();
  }

  if (!feed) {
    if (!yetkili) return null;
    return (
      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">📡 Toptancı XML/B2B Feed'i</h2>
        <p className="mt-1 text-xs text-slate-500">
          Bu tedarikçinin distribütör kataloğunu bağlayın — fiyat/stok verisi kendi ürün
          kartlarınızla otomatik eşleştirilir.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={saglayici}
            onChange={(e) => setSaglayici(e.target.value as ToptanciSaglayici)}
            className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
          >
            {Object.entries(TOPTANCI_SAGLAYICILAR).map(([key, ad]) => (
              <option key={key} value={key}>
                {ad}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={baglan}
            disabled={yukleniyor}
            className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {yukleniyor ? "Bağlanıyor…" : "Bağla"}
          </button>
        </div>
        {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
        <p className="mt-2 text-[11px] text-slate-600">
          Sandbox modu: gerçek bir distribütör API'sine bağlanılmaz, örnek bir katalogla çalışır.
        </p>
      </div>
    );
  }

  return (
    <div className="glass mt-4 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            📡 {TOPTANCI_SAGLAYICILAR[feed.provider_key]}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {feed.last_synced_at
              ? `Son senkron: ${new Date(feed.last_synced_at).toLocaleString("tr-TR")} · ${feed.last_sync_item_count ?? 0} kalem`
              : "Henüz senkronize edilmedi"}
          </p>
        </div>
        {yetkili && (
          <button
            type="button"
            onClick={senkronizeEt}
            disabled={yukleniyor}
            className="shrink-0 rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {yukleniyor ? "Senkronize ediliyor…" : "Şimdi Senkronize Et"}
          </button>
        )}
      </div>
      {sonuc && <p className="mt-2 text-xs text-emerald-300">{sonuc}</p>}
      {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
      {!!feed.last_synced_at && (
        <Link
          href={`/panel/tedarikciler/${supplierId}/xml-fiyatlari`}
          className="mt-2 inline-block text-xs font-medium text-nova-300 hover:text-nova-100"
        >
          Fiyat karşılaştırması ve fırsat listesi →
        </Link>
      )}
    </div>
  );
}
