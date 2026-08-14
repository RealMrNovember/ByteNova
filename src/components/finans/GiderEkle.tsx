"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GIDER_KATEGORILERI } from "@/lib/gider";

type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Props = {
  tenantId: string;
  kasaHesaplari: KasaHesabi[];
  onKaydedildi?: () => void;
};

export function GiderEkle({ tenantId, kasaHesaplari, onKaydedildi }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [kategori, setKategori] = useState("diger");
  const [aciklama, setAciklama] = useState("");
  const [tutar, setTutar] = useState("");
  const [hesapId, setHesapId] = useState(kasaHesaplari[0]?.id ?? "");
  const [tekrarlayan, setTekrarlayan] = useState(false);
  const [tekrarGunu, setTekrarGunu] = useState("1");
  const [fis, setFis] = useState<File | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kaydet() {
    const sayi = Number(tutar);
    if (!sayi || sayi <= 0) {
      setHata("Geçerli bir tutar girin.");
      return;
    }
    if (!hesapId) {
      setHata("Kasa hesabı seçin.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    let fisYolu: string | null = null;

    if (fis) {
      if (fis.size > 5 * 1024 * 1024) {
        setKaydediliyor(false);
        setHata("Fiş fotoğrafı en fazla 5 MB olabilir.");
        return;
      }
      const uzanti = fis.name.split(".").pop() ?? "jpg";
      const yol = `${tenantId}/giderler/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${uzanti}`;
      const { error: yuklemeHatasi } = await supabase.storage
        .from("servis-belgeleri")
        .upload(yol, fis, { contentType: fis.type });
      if (yuklemeHatasi) {
        setKaydediliyor(false);
        setHata("Fiş yüklenemedi.");
        return;
      }
      fisYolu = yol;
    }

    const { error } = await supabase.rpc("gider_ekle", {
      p_category: kategori,
      p_description: aciklama.trim() || null,
      p_amount: sayi,
      p_account_id: hesapId,
      p_is_recurring: tekrarlayan,
      p_recurrence_day: tekrarlayan ? Number(tekrarGunu) : null,
      p_receipt_path: fisYolu,
    });

    setKaydediliyor(false);
    if (error) {
      setHata("Gider kaydedilemedi.");
      return;
    }

    setKategori("diger");
    setAciklama("");
    setTutar("");
    setTekrarlayan(false);
    setFis(null);
    setAcik(false);
    router.refresh();
    onKaydedildi?.();
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
      >
        + Gider Ekle
      </button>
    );
  }

  if (!kasaHesaplari.length) {
    return (
      <div className="glass rounded-xl p-4 text-xs text-amber-300">
        Gider kaydedebilmek için önce bir kasa hesabı oluşturun.
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
        >
          {Object.entries(GIDER_KATEGORILERI).map(([k, v]) => (
            <option key={k} value={k}>
              {v.ikon} {v.etiket}
            </option>
          ))}
        </select>
        <select
          value={hesapId}
          onChange={(e) => setHesapId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
        >
          {kasaHesaplari.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Açıklama (opsiyonel)"
          className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          autoFocus
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="Tutar"
          className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={tekrarlayan}
            onChange={(e) => setTekrarlayan(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0"
          />
          Tekrarlayan gider
        </label>
        {tekrarlayan && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Her ayın</span>
            <input
              type="number"
              min="1"
              max="31"
              value={tekrarGunu}
              onChange={(e) => setTekrarGunu(e.target.value)}
              className="w-14 rounded-lg border border-slate-700 bg-surface px-2 py-1 text-center text-xs text-slate-200 outline-none focus:border-nova-500"
            />
            <span>günü</span>
          </div>
        )}
        <label className="cursor-pointer text-xs text-slate-500 hover:text-nova-300">
          {fis ? `📎 ${fis.name}` : "📎 Fiş fotoğrafı ekle"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFis(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </div>

      {hata && <p className="mt-2.5 text-xs text-red-300">{hata}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={kaydet}
          disabled={kaydediliyor}
          className="rounded-lg bg-nova-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          onClick={() => setAcik(false)}
          className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs text-slate-300"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
