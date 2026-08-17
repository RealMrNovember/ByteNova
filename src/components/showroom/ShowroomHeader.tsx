import Link from "next/link";

const NAV_LINKLERI = [
  { href: "/moduller", ad: "Modüller" },
  { href: "/fiyatlandirma", ad: "Fiyatlandırma" },
  { href: "/sss", ad: "SSS" },
  { href: "/demo", ad: "Canlı Demo" },
];

export default function ShowroomHeader({ oturumluMu }: { oturumluMu: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Byte<span className="text-nova-400">Nova</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKLERI.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              {l.ad}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-2 sm:gap-3">
          {oturumluMu ? (
            <Link
              href="/panel"
              className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-nova-400"
            >
              Panele Git →
            </Link>
          ) : (
            <>
              <Link
                href="/giris"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block"
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-nova-400"
              >
                Ücretsiz Dene
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
