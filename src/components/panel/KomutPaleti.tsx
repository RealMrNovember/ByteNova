"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuOgesi } from "@/lib/menu";
import { cihazIkon } from "@/lib/cihaz";
import { createClient } from "@/lib/supabase/client";

type Props = {
  menuOgeleri: MenuOgesi[];
  acik: boolean;
  kapat: () => void;
};

type Sonuc = {
  tur: "modul" | "musteri" | "cihaz";
  ikon: string;
  baslik: string;
  altYazi?: string;
  rozet?: string;
  yol: string;
};

export function KomutPaleti({ menuOgeleri, acik, kapat }: Props) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [secili, setSecili] = useState(0);
  const [kayitlar, setKayitlar] = useState<Sonuc[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modül eşleşmeleri (anlık, istemci tarafı)
  const modulSonuclari = useMemo<Sonuc[]>(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const liste = q
      ? menuOgeleri.filter((m) => m.ad.toLocaleLowerCase("tr").includes(q))
      : menuOgeleri;
    return liste.slice(0, q ? 4 : 8).map((m) => ({
      tur: "modul",
      ikon: m.ikon,
      baslik: m.ad,
      rozet:
        m.durum === "insa" ? "inşada" : m.durum === "yakinda" ? "yakında" : undefined,
      yol: m.slug ? `/panel/${m.slug}` : "/panel",
    }));
  }, [arama, menuOgeleri]);

  // Müşteri + cihaz araması (250ms debounce, min 2 karakter)
  useEffect(() => {
    const q = arama.trim();
    if (q.length < 2) {
      setKayitlar([]);
      return;
    }
    const zamanlayici = setTimeout(async () => {
      const supabase = createClient();
      const [mus, cih] = await Promise.all([
        supabase
          .from("customers")
          .select("id, name, phone, type")
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%,phone2.ilike.%${q}%`)
          .eq("is_active", true)
          .limit(4),
        supabase
          .from("devices")
          .select("id, device_type, brand, model, serial_no, imei")
          .or(
            `serial_no.ilike.%${q}%,imei.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`
          )
          .limit(4),
      ]);
      const sonuclar: Sonuc[] = [
        ...(mus.data ?? []).map((m) => ({
          tur: "musteri" as const,
          ikon: m.type === "corporate" ? "🏢" : "👤",
          baslik: m.name,
          altYazi: m.phone ?? undefined,
          yol: `/panel/musteriler/${m.id}`,
        })),
        ...(cih.data ?? []).map((c) => ({
          tur: "cihaz" as const,
          ikon: cihazIkon(c.device_type),
          baslik:
            [c.brand, c.model].filter(Boolean).join(" ") || "İsimsiz cihaz",
          altYazi: c.serial_no ?? c.imei ?? undefined,
          yol: `/panel/cihazlar/${c.id}`,
        })),
      ];
      setKayitlar(sonuclar);
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [arama]);

  const tumSonuclar = useMemo(
    () => [...kayitlar, ...modulSonuclari],
    [kayitlar, modulSonuclari]
  );

  useEffect(() => {
    if (acik) {
      setArama("");
      setSecili(0);
      setKayitlar([]);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [acik]);

  useEffect(() => {
    setSecili(0);
  }, [arama, kayitlar.length]);

  function git(s: Sonuc) {
    kapat();
    router.push(s.yol);
  }

  function tusla(e: React.KeyboardEvent) {
    if (e.key === "Escape") kapat();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSecili((s) => Math.min(s + 1, tumSonuclar.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSecili((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && tumSonuclar[secili]) {
      e.preventDefault();
      git(tumSonuclar[secili]);
    }
  }

  if (!acik) return null;

  const TUR_BASLIKLARI: Record<string, string> = {
    musteri: "Müşteriler",
    cihaz: "Cihazlar",
    modul: "Modüller",
  };

  let sonTur = "";

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
            placeholder="Müşteri adı, telefon, seri no, IMEI veya modül ara…"
            className="w-full bg-transparent py-3.5 text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
          <kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-600">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {tumSonuclar.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              Sonuç bulunamadı.
            </p>
          ) : (
            tumSonuclar.map((s, i) => {
              const baslikGoster = s.tur !== sonTur;
              sonTur = s.tur;
              return (
                <div key={`${s.tur}-${s.yol}`}>
                  {baslikGoster && (
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {TUR_BASLIKLARI[s.tur]}
                    </p>
                  )}
                  <button
                    onClick={() => git(s)}
                    onMouseEnter={() => setSecili(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      i === secili
                        ? "bg-nova-500/15 text-nova-200"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="text-base">{s.ikon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{s.baslik}</span>
                      {s.altYazi && (
                        <span className="block truncate font-mono text-[11px] text-slate-500">
                          {s.altYazi}
                        </span>
                      )}
                    </span>
                    {s.rozet && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                        {s.rozet}
                      </span>
                    )}
                    {i === secili && (
                      <kbd className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                        ↵
                      </kbd>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
