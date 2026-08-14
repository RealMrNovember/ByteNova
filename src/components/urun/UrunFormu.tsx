"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KategoriSec } from "./KategoriSec";

type Mevcut = {
  id: string;
  category_id: string | null;
  sku: string | null;
  barcode: string | null;
  name: string;
  brand: string | null;
  unit: string;
  purchase_price: number | null;
  sale_price: number | null;
  vat_rate: number;
  min_stock: number;
  critical_stock: number;
  requires_serial: boolean;
  warranty_months: number | null;
};

type Props = {
  tenantId: string;
  mevcut?: Mevcut;
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

const BIRIMLER = ["adet", "kutu", "metre", "kg", "paket"];

export function UrunFormu({ tenantId, mevcut }: Props) {
  const router = useRouter();
  const [ad, setAd] = useState(mevcut?.name ?? "");
  const [sku, setSku] = useState(mevcut?.sku ?? "");
  const [barkod, setBarkod] = useState(mevcut?.barcode ?? "");
  const [marka, setMarka] = useState(mevcut?.brand ?? "");
  const [kategoriId, setKategoriId] = useState<string | null>(
    mevcut?.category_id ?? null
  );
  const [birim, setBirim] = useState(mevcut?.unit ?? "adet");
  const [alisFiyati, setAlisFiyati] = useState(
    mevcut?.purchase_price?.toString() ?? ""
  );
  const [satisFiyati, setSatisFiyati] = useState(
    mevcut?.sale_price?.toString() ?? ""
  );
  const [kdv, setKdv] = useState(mevcut?.vat_rate?.toString() ?? "20");
  const [minStok, setMinStok] = useState(mevcut?.min_stock?.toString() ?? "0");
  const [kritikStok, setKritikStok] = useState(
    mevcut?.critical_stock?.toString() ?? "0"
  );
  const [seriZorunlu, setSeriZorunlu] = useState(
    mevcut?.requires_serial ?? false
  );
  const [garantiAy, setGarantiAy] = useState(
    mevcut?.warranty_months?.toString() ?? ""
  );
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const kayit = {
      category_id: kategoriId,
      sku: sku.trim() || null,
      barcode: barkod.trim() || null,
      name: ad.trim(),
      brand: marka.trim() || null,
      unit: birim,
      purchase_price: alisFiyati ? Number(alisFiyati) : null,
      sale_price: satisFiyati ? Number(satisFiyati) : null,
      vat_rate: Number(kdv) || 0,
      min_stock: Number(minStok) || 0,
      critical_stock: Number(kritikStok) || 0,
      requires_serial: seriZorunlu,
      warranty_months: garantiAy ? Number(garantiAy) : null,
    };

    if (mevcut) {
      const { error } = await supabase
        .from("products")
        .update(kayit)
        .eq("id", mevcut.id);
      setYukleniyor(false);
      if (error) {
        setHata(
          error.code === "23505"
            ? "Bu barkod işletmenizde başka bir üründe kayıtlı."
            : "Ürün güncellenemedi."
        );
        return;
      }
      await supabase.rpc("audit_ekle", {
        p_action: "urun_guncellendi",
        p_entity: "product",
        p_entity_id: mevcut.id,
      });
      router.push(`/panel/stok/${mevcut.id}`);
      router.refresh();
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("products")
        .insert({ ...kayit, tenant_id: tenantId, created_by: user?.id })
        .select("id")
        .single();
      setYukleniyor(false);
      if (error || !data) {
        setHata(
          error?.code === "23505"
            ? "Bu barkod işletmenizde zaten kayıtlı."
            : "Ürün kaydedilemedi."
        );
        return;
      }
      await supabase.rpc("audit_ekle", {
        p_action: "urun_olusturuldu",
        p_entity: "product",
        p_entity_id: data.id,
        p_new: { name: kayit.name, barcode: kayit.barcode },
      });
      router.push(`/panel/stok/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Ürün adı *
        </label>
        <input
          type="text"
          required
          autoFocus
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Örn: Kingston 8GB DDR4 RAM"
          className={alanSinifi}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            SKU
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Stok kodu (opsiyonel)"
            className={`${alanSinifi} font-mono`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Barkod
          </label>
          <input
            type="text"
            value={barkod}
            onChange={(e) => setBarkod(e.target.value)}
            placeholder="Barkod okut veya yaz"
            className={`${alanSinifi} font-mono`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Marka
          </label>
          <input
            type="text"
            value={marka}
            onChange={(e) => setMarka(e.target.value)}
            placeholder="Kingston, Samsung…"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Kategori
          </label>
          <KategoriSec
            tenantId={tenantId}
            seciliId={kategoriId}
            onSec={setKategoriId}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Alış fiyatı (TL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={alisFiyati}
            onChange={(e) => setAlisFiyati(e.target.value)}
            placeholder="0.00"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Satış fiyatı (TL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={satisFiyati}
            onChange={(e) => setSatisFiyati(e.target.value)}
            placeholder="0.00"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            KDV (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={kdv}
            onChange={(e) => setKdv(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-600">
        💵 Dövizli alış fiyatı ve otomatik kur bazlı fiyatlama Gün 12&apos;de
        eklenecek — şimdilik TL girin.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Birim
          </label>
          <select
            value={birim}
            onChange={(e) => setBirim(e.target.value)}
            className={alanSinifi}
          >
            {BIRIMLER.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Min. stok
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={minStok}
            onChange={(e) => setMinStok(e.target.value)}
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Kritik stok
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={kritikStok}
            onChange={(e) => setKritikStok(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={seriZorunlu}
            onChange={(e) => setSeriZorunlu(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0 focus:ring-offset-0"
          />
          Seri numarası zorunlu (laptop, ekran kartı vb.)
        </label>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Garanti (ay)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={garantiAy}
            onChange={(e) => setGarantiAy(e.target.value)}
            placeholder="Örn: 24"
            className={alanSinifi}
          />
        </div>
      </div>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {hata}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={yukleniyor || !ad.trim()}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor
            ? "Kaydediliyor…"
            : mevcut
              ? "Değişiklikleri Kaydet"
              : "Ürünü Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
