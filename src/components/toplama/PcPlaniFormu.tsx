"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { PcYapilandirici, type YapilandiricaKalemi } from "./PcYapilandirici";

type Musteri = { id: string; name: string; phone: string | null };

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function PcPlaniFormu({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [ad, setAd] = useState("");
  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [iscilik, setIscilik] = useState("0");
  const [kalemler, setKalemler] = useState<YapilandiricaKalemi[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kaydet() {
    if (!ad.trim()) {
      setHata("Plan adı gerekli.");
      return;
    }
    if (kalemler.length === 0) {
      setHata("En az bir kalem ekleyin.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("pc_plani_olustur", {
      p_musteri_id: musteri?.id ?? null,
      p_ad: ad.trim(),
      p_iscilik: Number(iscilik) || 0,
      p_kalemler: kalemler.map((k, i) => ({
        component_type: k.componentType,
        name: k.name,
        brand: k.brand,
        estimated_price: k.price,
        quantity: k.quantity,
        sort_order: i,
      })),
    });
    setYukleniyor(false);
    if (error || !data) {
      setHata("Plan oluşturulamadı.");
      return;
    }
    router.push(`/panel/pc-toplama/plan/${data}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-purple-500/25 bg-purple-500/5 px-3.5 py-3 text-xs text-purple-200">
        🌐 <strong>Genel/Plan modu:</strong> stoğunuzda olmayan ürün tipleriyle de bir
        yapılandırma planlayıp müşteriye fiyat verebilirsiniz. Gerçek bir toplama emrine
        dönüştürmek istediğinizde her kalemi bir stok kartıyla eşleştirmeniz istenecek.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Plan adı *</label>
          <input
            type="text"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Örn: Oyun PC'si Teklifi — Ahmet Bey"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Montaj işçiliği (TL)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={iscilik}
            onChange={(e) => setIscilik(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Müşteri (opsiyonel)</label>
        <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Kalemler</label>
        <PcYapilandirici mod="genel" kalemler={kalemler} onKalemlerDegisti={setKalemler} iscilik={Number(iscilik) || 0} />
      </div>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={kaydet}
          disabled={yukleniyor}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor ? "Oluşturuluyor…" : "Planı Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
