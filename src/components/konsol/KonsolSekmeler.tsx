"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEKMELER = [
  { href: "/konsol", ad: "Tenant Listesi", ikon: "🏢" },
  { href: "/konsol/kullanicilar", ad: "Kullanıcılar", ikon: "👥" },
  { href: "/konsol/loglar", ad: "Sistem Logları", ikon: "📜" },
  { href: "/konsol/adminler", ad: "Adminler", ikon: "🛡️" },
  { href: "/konsol/ayarlar", ad: "Platform Ayarları", ikon: "🎛️" },
];

export function KonsolSekmeler() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 border-t border-slate-800/60 px-4 sm:px-6">
      {SEKMELER.map((s) => {
        const aktif = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              aktif
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>{s.ikon}</span>
            {s.ad}
          </Link>
        );
      })}
    </nav>
  );
}
