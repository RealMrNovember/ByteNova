"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MenuOgesi } from "@/lib/menu";
import { cikisYap } from "@/app/panel/actions";
import { KomutPaleti } from "./KomutPaleti";

type Props = {
  menuOgeleri: MenuOgesi[];
  tenantAdi: string;
  logoUrl: string | null;
  kullaniciAdi: string;
  email: string;
  kalanGun: number | null;
  kurlar: { kod: string; kur: number | null }[];
  platformAdminMi?: boolean;
  children: React.ReactNode;
};

function Rozet({ durum }: { durum: "insa" | "yakinda" | "kilitli" }) {
  if (durum === "insa") {
    return (
      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
        İnşada
      </span>
    );
  }
  if (durum === "kilitli") {
    return (
      <span className="rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-purple-300">
        🔒 Eklenti
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
      Yakında
    </span>
  );
}

export function PanelKabuk({
  menuOgeleri,
  tenantAdi,
  logoUrl,
  kullaniciAdi,
  email,
  kalanGun,
  kurlar,
  platformAdminMi = false,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuDar, setMenuDar] = useState(false);
  const [profilAcik, setProfilAcik] = useState(false);
  const [paletAcik, setPaletAcik] = useState(false);
  const profilRef = useRef<HTMLDivElement>(null);

  // Ctrl+K / Cmd+K komut paleti, F2 hızlı satış
  useEffect(() => {
    function kisayol(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletAcik((a) => !a);
        return;
      }
      if (e.key === "F2" && pathname !== "/panel/satis") {
        e.preventDefault();
        router.push("/panel/satis");
      }
    }
    window.addEventListener("keydown", kisayol);
    return () => window.removeEventListener("keydown", kisayol);
  }, [pathname, router]);

  // Daraltma tercihini hatırla
  useEffect(() => {
    setMenuDar(localStorage.getItem("bn-menu-dar") === "1");
  }, []);
  function menuDaralt() {
    setMenuDar((d) => {
      localStorage.setItem("bn-menu-dar", d ? "0" : "1");
      return !d;
    });
  }

  // Profil menüsü dış tıklama ile kapansın
  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) {
        setProfilAcik(false);
      }
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  function aktifMi(slug: string) {
    const yol = slug ? `/panel/${slug}` : "/panel";
    return slug === ""
      ? pathname === "/panel"
      : pathname === yol || pathname.startsWith(yol + "/");
  }

  const mobilSekmeler = [
    { slug: "", ad: "Genel", ikon: "🏠" },
    { slug: "servisler", ad: "Servisler", ikon: "🔧" },
    { slug: "satis", ad: "Satış", ikon: "🧾" },
    { slug: "menu", ad: "Menü", ikon: "☰" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* ===== Sol menü (masaüstü) ===== */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800/60 bg-surface-2 transition-all duration-200 md:flex ${
          menuDar ? "w-[60px]" : "w-56"
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-800/60 px-4">
          <span className="text-lg">⚡</span>
          {!menuDar && (
            <span className="truncate text-sm font-semibold text-white">
              Byte<span className="text-nova-400">Nova</span>
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {menuOgeleri.map((m) => (
            <Link
              key={m.slug}
              href={m.slug ? `/panel/${m.slug}` : "/panel"}
              title={m.ad}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                aktifMi(m.slug)
                  ? "bg-nova-500/15 font-medium text-nova-300"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <span className="text-base leading-none">{m.ikon}</span>
              {!menuDar && (
                <>
                  <span className="flex-1 truncate">{m.ad}</span>
                  {m.durum !== "aktif" && <Rozet durum={m.durum} />}
                </>
              )}
            </Link>
          ))}
        </nav>

        <button
          onClick={menuDaralt}
          className="flex h-11 items-center justify-center border-t border-slate-800/60 text-slate-500 transition-colors hover:text-slate-300"
          title={menuDar ? "Menüyü genişlet" : "Menüyü daralt"}
        >
          {menuDar ? "»" : "«"}
        </button>
      </aside>

      {/* ===== Sağ taraf ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-800/60 bg-surface/90 px-4 backdrop-blur">
          {/* Sol bölge: mobil logo. min-w-0 sayesinde içeriği olmadığı
              masaüstünde 0'a kadar küçülebilir — sağ bölgenin doğal
              genişliğini asla sıkıştırmaz. */}
          <div className="flex min-w-0 flex-1 items-center">
            <Link href="/panel" className="text-lg md:hidden">
              ⚡
            </Link>
          </div>

          {/* Orta bölge: arama / komut paleti. min-w-0 ile gerektiğinde
              küçülür, asla sağ bölgenin üzerine taşmaz. */}
          <button
            onClick={() => setPaletAcik(true)}
            className="hidden min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-surface-2 px-3 py-1.5 text-left text-[13px] text-slate-500 transition-colors hover:border-slate-600 sm:flex"
            title="Komut paleti (Ctrl+K)"
          >
            <span>🔍</span>
            <span className="flex-1 truncate">Ara: müşteri, servis no, seri no…</span>
            <kbd className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-600">
              Ctrl K
            </kbd>
          </button>

          {/* Sağ bölge: kur, deneme, bildirim, profil — sağa yaslı. shrink-0
              ile her zaman kendi doğal genişliğini alır; esneyen sol/orta
              bölgeler bu genişliğe göre küçülür, asla üzerine binmez. */}
          <div className="flex shrink-0 items-center justify-end gap-3">
            {/* Kur göstergesi — TCMB günlük / dükkân override */}
            <Link
              href="/panel/ayarlar#doviz"
              className="hidden items-center gap-2.5 rounded-lg border border-slate-800 px-2.5 py-1.5 font-mono text-[12px] text-slate-400 transition-colors hover:border-nova-500/40 lg:flex"
              title="Döviz kurları — Ayarlar'dan güncelleyin"
            >
              {kurlar.map((k) => (
                <span key={k.kod}>
                  {k.kod} {k.kur != null ? k.kur.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "—,——"}
                </span>
              ))}
            </Link>

            {/* Deneme rozeti */}
            {kalanGun !== null && (
              <span className="hidden shrink-0 rounded-full border border-nova-500/30 bg-nova-500/10 px-3 py-1 text-[11px] font-medium text-nova-300 sm:inline">
                Deneme: {kalanGun} gün
              </span>
            )}

            {/* Kullanım kılavuzu */}
            <Link
              href="/panel/kilavuz"
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-200"
              title="Kullanım Kılavuzu"
            >
              ❓
            </Link>

            {/* Bildirim */}
            <button
              className="relative shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-200"
              title="Bildirimler — yakında"
            >
              🔔
            </button>

            {/* Profil menüsü */}
            <div className="relative shrink-0" ref={profilRef}>
              <button
                onClick={() => setProfilAcik((a) => !a)}
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-800/50"
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-8 w-8 rounded-lg border border-slate-700 object-contain"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nova-500/20 text-sm font-semibold text-nova-300">
                    {tenantAdi.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[120px] truncate text-[13px] text-slate-300 md:inline">
                  {tenantAdi}
                </span>
              </button>

              {profilAcik && (
                <div className="glass absolute right-0 top-11 z-30 w-56 rounded-xl p-2 shadow-xl shadow-black/40">
                  <div className="border-b border-slate-800 px-3 pb-2 pt-1">
                    <p className="truncate text-sm font-medium text-white">
                      {kullaniciAdi}
                    </p>
                    <p className="truncate text-xs text-slate-500">{email}</p>
                  </div>
                  <Link
                    href="/kurulum"
                    onClick={() => setProfilAcik(false)}
                    className="mt-1 block rounded-lg px-3 py-2 text-[13px] text-slate-300 transition-colors hover:bg-slate-800/60"
                  >
                    🏪 İşletme bilgileri
                  </Link>
                  {platformAdminMi && (
                    <Link
                      href="/konsol"
                      onClick={() => setProfilAcik(false)}
                      className="block rounded-lg px-3 py-2 text-[13px] text-purple-300 transition-colors hover:bg-purple-500/10"
                    >
                      🛡️ ByteNova Konsol
                    </Link>
                  )}
                  <form action={cikisYap}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      ↩ Çıkış yap
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* İçerik */}
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8">
          {children}
        </main>
      </div>

      {/* ===== Komut paleti ===== */}
      <KomutPaleti
        menuOgeleri={menuOgeleri}
        acik={paletAcik}
        kapat={() => setPaletAcik(false)}
      />

      {/* ===== Mobil alt sekmeler ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-800/60 bg-surface-2/95 backdrop-blur md:hidden">
        {mobilSekmeler.map((s) => (
          <Link
            key={s.slug}
            href={s.slug ? `/panel/${s.slug}` : "/panel"}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
              aktifMi(s.slug)
                ? "text-nova-300"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">{s.ikon}</span>
            {s.ad}
          </Link>
        ))}
      </nav>
    </div>
  );
}
