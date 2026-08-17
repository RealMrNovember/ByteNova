"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Anahtar = {
  id: string;
  key_value: string;
  status: string;
  used_at: string | null;
  created_at: string;
  musteriAdi: string | null;
  satisNo: string | null;
};

type Props = {
  productId: string;
  yetkili: boolean;
  anahtarlar: Anahtar[];
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

function DurumRozeti({ durum }: { durum: string }) {
  if (durum === "satildi") {
    return (
      <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
        Satıldı
      </span>
    );
  }
  if (durum === "iptal") {
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">
        İptal
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
      Müsait
    </span>
  );
}

export function LisansAnahtariYonetimi({ productId, yetkili, anahtarlar }: Props) {
  const router = useRouter();
  const [metin, setMetin] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [iptalEdiliyor, setIptalEdiliyor] = useState<string | null>(null);

  const musaitSayisi = anahtarlar.filter((a) => a.status === "musait").length;
  const satilanSayisi = anahtarlar.filter((a) => a.status === "satildi").length;

  async function anahtarlariEkle(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setSonuc(null);
    const satirlar = metin
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (satirlar.length === 0) {
      setHata("En az bir anahtar girin.");
      return;
    }
    setYukleniyor(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("lisans_anahtari_toplu_ekle", {
      p_product_id: productId,
      p_anahtarlar: satirlar,
    });
    setYukleniyor(false);
    if (error) {
      setHata("Anahtarlar eklenemedi.");
      return;
    }
    const yinelenen = satirlar.length - (data ?? 0);
    setSonuc(
      `${data} anahtar eklendi.` +
        (yinelenen > 0 ? ` (${yinelenen} tanesi zaten kayıtlıydı, atlandı.)` : "")
    );
    setMetin("");
    router.refresh();
  }

  async function anahtariIptalEt(id: string) {
    setIptalEdiliyor(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("lisans_anahtari_iptal", { p_key_id: id });
    setIptalEdiliyor(null);
    if (!error) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-emerald-300">{musaitSayisi}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Müsait</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-slate-300">{satilanSayisi}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Satılmış</p>
        </div>
      </div>

      {yetkili && (
        <form onSubmit={anahtarlariEkle} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Yeni anahtarlar ekle (her satırda bir tane)
            </label>
            <textarea
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              rows={5}
              placeholder={"XXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY"}
              className={`${alanSinifi} font-mono`}
            />
          </div>
          {hata && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {hata}
            </div>
          )}
          {sonuc && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              {sonuc}
            </div>
          )}
          <button
            type="submit"
            disabled={yukleniyor}
            className="rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
          >
            {yukleniyor ? "Ekleniyor…" : "Anahtarları Ekle"}
          </button>
        </form>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white">Tüm Anahtarlar</h3>
        {anahtarlar.length === 0 ? (
          <p className="mt-3 text-center text-xs text-slate-600">
            Henüz anahtar eklenmedi.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-800/60">
            {anahtarlar.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300">
                  {a.key_value}
                </span>
                {a.status === "satildi" && (
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {a.satisNo ?? "—"}
                    {a.musteriAdi ? ` · ${a.musteriAdi}` : ""}
                  </span>
                )}
                <DurumRozeti durum={a.status} />
                {yetkili && a.status === "musait" && (
                  <button
                    onClick={() => anahtariIptalEt(a.id)}
                    disabled={iptalEdiliyor === a.id}
                    className="shrink-0 text-[11px] text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    İptal et
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
