"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  KILAVUZ_KATEGORI_ADLARI,
  type KilavuzKategori,
  type KilavuzKonu,
} from "@/lib/kilavuz";

const KATEGORI_SIRASI: KilavuzKategori[] = ["baslarken", "modul", "referans"];

function eslesiyorMu(konu: KilavuzKonu, sorgu: string) {
  const s = sorgu.toLocaleLowerCase("tr-TR");
  if (konu.baslik.toLocaleLowerCase("tr-TR").includes(s)) return true;
  if (konu.ozet.toLocaleLowerCase("tr-TR").includes(s)) return true;
  return konu.anahtarKelimeler.some((k) => k.toLocaleLowerCase("tr-TR").includes(s));
}

export function KilavuzArama({ konular }: { konular: KilavuzKonu[] }) {
  const [sorgu, setSorgu] = useState("");

  const filtreli = useMemo(() => {
    const q = sorgu.trim();
    if (!q) return konular;
    return konular.filter((k) => eslesiyorMu(k, q));
  }, [konular, sorgu]);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          🔍
        </span>
        <input
          type="text"
          value={sorgu}
          onChange={(e) => setSorgu(e.target.value)}
          placeholder="Kılavuzda ara: örn. iskonto, kasa kapanışı, sayım…"
          className="w-full rounded-lg border border-slate-700 bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
      </div>

      {!filtreli.length ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          &quot;{sorgu}&quot; ile eşleşen bir konu bulunamadı — farklı bir kelime deneyin
          veya sayfanın altındaki WhatsApp destek hattından bize sorun.
        </p>
      ) : (
        KATEGORI_SIRASI.map((kategori) => {
          const grup = filtreli.filter((k) => k.kategori === kategori);
          if (!grup.length) return null;
          return (
            <div key={kategori} className="mt-7 first:mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {KILAVUZ_KATEGORI_ADLARI[kategori]}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {grup.map((k) => (
                  <Link
                    key={k.slug}
                    href={`/panel/kilavuz/${k.slug}`}
                    className="glass rounded-xl p-4 transition-colors hover:border-nova-500/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{k.ikon}</span>
                      <p className="text-sm font-semibold text-white">{k.baslik}</p>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      {k.ozet}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
