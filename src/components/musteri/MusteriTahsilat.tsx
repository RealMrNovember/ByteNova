"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";

type KasaHesabi = { id: string; name: string; type: "nakit" | "banka" | "pos" };

type Props = {
  customerId: string;
  bakiye: number;
  yetkili: boolean;
  hareketYok: boolean;
  kasaHesaplari: KasaHesabi[];
};

export function MusteriTahsilat({ customerId, bakiye, yetkili, hareketYok, kasaHesaplari }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [tutar, setTutar] = useState(bakiye > 0 ? bakiye.toString() : "");
  const [hesapId, setHesapId] = useState(kasaHesaplari[0]?.id ?? "");
  const [aciklama, setAciklama] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const [acilisAcik, setAcilisAcik] = useState(false);
  const [acilisTutar, setAcilisTutar] = useState("");
  const [acilisAciklama, setAcilisAciklama] = useState("");
  const [acilisKaydediliyor, setAcilisKaydediliyor] = useState(false);
  const [acilisHata, setAcilisHata] = useState<string | null>(null);

  async function tahsilatAl() {
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
    const { error } = await supabase.rpc("musteri_tahsilat_al", {
      p_customer_id: customerId,
      p_tutar: sayi,
      p_account_id: hesapId,
      p_aciklama: aciklama.trim() || null,
    });

    setKaydediliyor(false);
    if (error) {
      setHata("Tahsilat kaydedilemedi.");
      return;
    }

    setTutar("");
    setAciklama("");
    setAcik(false);
    router.refresh();
  }

  async function acilisBakiyesiKaydet() {
    const sayi = Number(acilisTutar);
    if (!sayi) {
      setAcilisHata("Geçerli bir tutar girin.");
      return;
    }
    setAcilisKaydediliyor(true);
    setAcilisHata(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("musteri_acilis_bakiyesi_belirle", {
      p_customer_id: customerId,
      p_tutar: sayi,
      p_aciklama: acilisAciklama.trim() || null,
    });

    setAcilisKaydediliyor(false);
    if (error) {
      setAcilisHata("Açılış bakiyesi kaydedilemedi.");
      return;
    }

    setAcilisAcik(false);
    router.refresh();
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Cari Bakiye</h2>
          <p
            className={`mt-1 text-2xl font-bold ${bakiye > 0 ? "text-amber-300" : "text-slate-200"}`}
          >
            {paraFormatla(bakiye)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {bakiye > 0
              ? "Müşterinin açık hesap borcu"
              : "Açık hesap borcu yok"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <a
            href={`/api/musteri/${customerId}/ekstre?indir=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-slate-400 hover:text-nova-300"
          >
            📄 Ekstre (PDF)
          </a>
          {yetkili && bakiye > 0 && !acik && (
            <button
              onClick={() => setAcik(true)}
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
            >
              + Tahsilat Al
            </button>
          )}
          {yetkili && hareketYok && !acilisAcik && (
            <button
              onClick={() => setAcilisAcik(true)}
              className="rounded-lg border border-dashed border-slate-700 px-3.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:border-nova-500/50 hover:text-nova-300"
            >
              📥 Açılış Bakiyesi Belirle
            </button>
          )}
        </div>
      </div>

      {acik && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-slate-800 bg-surface-2 p-3.5">
          {!kasaHesaplari.length ? (
            <p className="text-xs text-amber-300">
              Önce Finans&apos;tan bir kasa hesabı oluşturmalısınız.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
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
              </div>
              <input
                type="text"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Açıklama (opsiyonel)"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
              />
              {hata && <p className="text-xs text-red-300">{hata}</p>}
              <div className="flex gap-2">
                <button
                  onClick={tahsilatAl}
                  disabled={kaydediliyor}
                  className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
                >
                  {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button
                  onClick={() => setAcik(false)}
                  className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
                >
                  Vazgeç
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {acilisAcik && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-slate-800 bg-surface-2 p-3.5">
          <p className="text-[11px] text-slate-500">
            Eski sisteminizden devreden bir alacağınız varsa buradan tek seferlik girin. Bu, gerçek bir satış olarak sayılmaz.
          </p>
          <input
            type="number"
            step="0.01"
            autoFocus
            value={acilisTutar}
            onChange={(e) => setAcilisTutar(e.target.value)}
            placeholder="Devreden bakiye (TL)"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          <input
            type="text"
            value={acilisAciklama}
            onChange={(e) => setAcilisAciklama(e.target.value)}
            placeholder="Açıklama (opsiyonel)"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          {acilisHata && <p className="text-xs text-red-300">{acilisHata}</p>}
          <div className="flex gap-2">
            <button
              onClick={acilisBakiyesiKaydet}
              disabled={acilisKaydediliyor}
              className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
            >
              {acilisKaydediliyor ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              onClick={() => setAcilisAcik(false)}
              className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
