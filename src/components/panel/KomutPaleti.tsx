"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuOgesi } from "@/lib/menu";

type Props = {
  menuOgeleri: MenuOgesi[];
  acik: boolean;
  kapat: () => void;
};

export function KomutPaleti({ menuOgeleri, acik, kapat }: Props) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [secili, setSecili] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sonuclar = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const liste = q
      ? menuOgeleri.filter((m) => m.ad.toLocaleLowerCase("tr").includes(q))
      : menuOgeleri;
    return liste.slice(0, 8);
  }, [arama, menuOgeleri]);

  // Açılınca sıfırla + odaklan
  useEffect(() => {
    if (acik) {
      setArama("");
      setSecili(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [acik]);

  useEffect(() => {
    setSecili(0);
  }, [arama]);

  function git(m: MenuOgesi) {
    kapat();
    router.push(m.slug ? `/panel/${m.slug}` : "/panel");
  }

  function tusla(e: React.KeyboardEvent) {
    if (e.key === "Escape") kapat();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSecili((s) => Math.min(s + 1, sonuclar.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSecili((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && sonuclar[secili]) {
      e.preventDefault();
      git(sonuclar[secili]);
    }
  }

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) kapat();
      }}
    >
      <div className="glass w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 border-b border-slate-800 px-4">
          <span className="text-slate-500">🔍</span>
          <input
            ref={inputRef}
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            onKeyDown={tusla}
            placeholder="Modül ara veya git… (müşteri/servis araması yakında)"
            className="w-full bg-transparent py-3.5 text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
          <kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-600">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {sonuclar.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              Sonuç yok — müşteri ve servis araması Sprint 2&apos;de eklenecek.
            </p>
          ) : (
            sonuclar.map((m, i) => (
              <button
                key={m.slug}
                onClick={() => git(m)}
                onMouseEnter={() => setSecili(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === secili
                    ? "bg-nova-500/15 text-nova-200"
                    : "text-slate-300"
                }`}
              >
                <span className="text-base">{m.ikon}</span>
                <span className="flex-1">{m.ad}</span>
                {m.durum !== "aktif" && (
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {m.durum === "insa" ? "inşada" : "yakında"}
                  </span>
                )}
                {i === secili && (
                  <kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
