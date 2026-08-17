"use client";

import { useState } from "react";
import { IMPORT_TURLERI, type ImportTuru } from "@/lib/import";

type SatirHam = Record<string, string | number | null>;
type SonucSatiri = { satir: number; ok: boolean; mesaj?: string };

export function ImportSihirbazi({ baslangicTuru = "musteri" }: { baslangicTuru?: ImportTuru }) {
  const [adim, setAdim] = useState<1 | 2 | 3 | 4>(1);
  const [tur, setTur] = useState<ImportTuru>(baslangicTuru);
  const [dosya, setDosya] = useState<File | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const [sutunlar, setSutunlar] = useState<string[]>([]);
  const [satirlarHam, setSatirlarHam] = useState<SatirHam[]>([]);
  const [esleme, setEsleme] = useState<Record<string, string>>({});

  const [sonuc, setSonuc] = useState<{ toplam: number; basarili: number; sonuclar: SonucSatiri[] } | null>(null);

  const tanim = IMPORT_TURLERI[tur];

  async function dosyayiIsle() {
    if (!dosya) return;
    setYukleniyor(true);
    setHata(null);
    const form = new FormData();
    form.append("dosya", dosya);
    const res = await fetch("/api/import/parse", { method: "POST", body: form });
    const veri = await res.json();
    setYukleniyor(false);
    if (!res.ok) {
      setHata(veri.hata ?? "Dosya işlenemedi.");
      return;
    }
    setSutunlar(veri.columns);
    setSatirlarHam(veri.rows);

    // Aynı/benzer adlı sütunları otomatik eşle
    const otoEsleme: Record<string, string> = {};
    for (const alan of tanim.alanlar) {
      const bulunan = (veri.columns as string[]).find(
        (c) => c.toLocaleLowerCase("tr") === alan.etiket.toLocaleLowerCase("tr").split(" (")[0]
      );
      if (bulunan) otoEsleme[alan.key] = bulunan;
    }
    setEsleme(otoEsleme);
    setAdim(2);
  }

  function esleneRows(): Record<string, string | number | null>[] {
    return satirlarHam.map((satir) => {
      const obj: Record<string, string | number | null> = {};
      for (const alan of tanim.alanlar) {
        const kaynakSutun = esleme[alan.key];
        obj[alan.key] = kaynakSutun ? (satir[kaynakSutun] ?? null) : null;
      }
      return obj;
    });
  }

  async function iceAktar() {
    setYukleniyor(true);
    setHata(null);
    const res = await fetch("/api/import/calistir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tur, satirlar: esleneRows() }),
    });
    const veri = await res.json();
    setYukleniyor(false);
    if (!res.ok) {
      setHata(veri.hata ?? "İçe aktarma başarısız.");
      return;
    }
    setSonuc(veri);
    setAdim(4);
  }

  function bastanBasla() {
    setAdim(1);
    setDosya(null);
    setSutunlar([]);
    setSatirlarHam([]);
    setEsleme({});
    setSonuc(null);
    setHata(null);
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex items-center gap-2 text-[11px] text-slate-500">
        {["Tür ve Dosya", "Sütun Eşleme", "Önizleme", "Sonuç"].map((etiket, i) => (
          <span key={etiket} className={`flex items-center gap-1 ${adim === i + 1 ? "text-nova-300" : ""}`}>
            {i > 0 && <span className="text-slate-700">→</span>}
            {i + 1}. {etiket}
          </span>
        ))}
      </div>

      {adim === 1 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Ne aktarıyorsunuz?</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(IMPORT_TURLERI) as ImportTuru[]).map((t) => (
              <button
                key={t}
                onClick={() => setTur(t)}
                className={`rounded-lg border px-3.5 py-2.5 text-left text-sm transition ${
                  tur === t ? "border-nova-500/60 bg-nova-500/10 text-nova-300" : "border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                <span className="mr-1.5">{IMPORT_TURLERI[t].ikon}</span>
                {IMPORT_TURLERI[t].ad}
                <p className="mt-0.5 text-[11px] text-slate-500">{IMPORT_TURLERI[t].aciklama}</p>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Excel Dosyası (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:text-slate-200"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              İlk satır sütun başlığı olmalı. En fazla 5 MB / 2000 satır.
            </p>
          </div>

          {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}

          <button
            onClick={dosyayiIsle}
            disabled={!dosya || yukleniyor}
            className="mt-4 rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-50"
          >
            {yukleniyor ? "Okunuyor…" : "Devam Et →"}
          </button>
        </div>
      )}

      {adim === 2 && (
        <div>
          <p className="text-xs text-slate-400">
            Dosyanızdaki {satirlarHam.length} satır bulundu. Her alanı dosyanızdaki ilgili sütunla eşleştirin.
          </p>
          <div className="mt-3 space-y-2">
            {tanim.alanlar.map((alan) => (
              <div key={alan.key} className="flex items-center gap-2">
                <span className="w-56 shrink-0 text-xs text-slate-300">
                  {alan.etiket}
                  {alan.zorunlu && <span className="text-red-400"> *</span>}
                </span>
                <select
                  value={esleme[alan.key] ?? ""}
                  onChange={(e) => setEsleme((s) => ({ ...s, [alan.key]: e.target.value }))}
                  className="flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-nova-500"
                >
                  <option value="">— Boş bırak —</option>
                  {sutunlar.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setAdim(3)} className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-nova-400">
              Devam Et →
            </button>
            <button onClick={bastanBasla} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">
              Baştan Başla
            </button>
          </div>
        </div>
      )}

      {adim === 3 && (
        <div>
          <p className="text-xs text-slate-400">
            İlk 5 satırın önizlemesi — {satirlarHam.length} satırın tamamı aktarılacak.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  {tanim.alanlar.map((a) => (
                    <th key={a.key} className="px-3 py-2 font-medium">
                      {a.etiket.split(" (")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {esleneRows()
                  .slice(0, 5)
                  .map((row, i) => (
                    <tr key={i}>
                      {tanim.alanlar.map((a) => (
                        <td key={a.key} className="whitespace-nowrap px-3 py-2 text-slate-300">
                          {row[a.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={iceAktar}
              disabled={yukleniyor}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-50"
            >
              {yukleniyor ? "Aktarılıyor…" : `${satirlarHam.length} Satırı İçe Aktar`}
            </button>
            <button onClick={() => setAdim(2)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">
              ← Geri
            </button>
          </div>
        </div>
      )}

      {adim === 4 && sonuc && (
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sonuc.basarili === sonuc.toplam ? "✅" : "⚠️"}</span>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {sonuc.basarili} / {sonuc.toplam} satır başarıyla aktarıldı
              </p>
              {sonuc.basarili < sonuc.toplam && (
                <p className="text-xs text-amber-300">{sonuc.toplam - sonuc.basarili} satırda hata oluştu, aşağıda listelendi.</p>
              )}
            </div>
          </div>

          {sonuc.sonuclar.some((s) => !s.ok) && (
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-slate-800">
              {sonuc.sonuclar
                .filter((s) => !s.ok)
                .map((s) => (
                  <div key={s.satir} className="flex items-center gap-2 border-b border-slate-800/60 px-3 py-1.5 text-xs last:border-0">
                    <span className="text-slate-500">Satır {s.satir}</span>
                    <span className="text-red-300">{s.mesaj}</span>
                  </div>
                ))}
            </div>
          )}

          <button onClick={bastanBasla} className="mt-4 rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-nova-400">
            Yeni İçe Aktarma Başlat
          </button>
        </div>
      )}
    </div>
  );
}
