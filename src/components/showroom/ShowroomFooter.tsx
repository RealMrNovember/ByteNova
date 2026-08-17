import Link from "next/link";

const FOOTER_LINKLERI = [
  { href: "/moduller", ad: "Modüller" },
  { href: "/fiyatlandirma", ad: "Fiyatlandırma" },
  { href: "/sss", ad: "SSS" },
  { href: "/demo", ad: "Canlı Demo" },
  { href: "/kayit", ad: "Ücretsiz Dene" },
];

export default function ShowroomFooter() {
  return (
    <footer className="border-t border-slate-800/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="font-semibold text-white">
              Byte<span className="text-nova-400">Nova</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKLERI.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                {l.ad}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-slate-500 sm:flex-row sm:justify-between sm:text-left">
          <span>
            © {new Date().getFullYear()} CiciByte Teknoloji —{" "}
            <a
              href="https://cicibyte.com"
              className="text-slate-400 transition-colors hover:text-nova-300"
            >
              cicibyte.com
            </a>
          </span>
          <span>ByteNova • Sürüm 0.1 — her gün yeni bir özellikle büyüyor</span>
        </div>
      </div>
    </footer>
  );
}
