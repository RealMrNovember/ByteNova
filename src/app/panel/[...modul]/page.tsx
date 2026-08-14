import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { modulBul } from "@/lib/menu";

export default async function ModulPage({
  params,
}: {
  params: Promise<{ modul: string[] }>;
}) {
  const { modul } = await params;
  const slug = modul[0];
  const m = modulBul(slug);

  if (!m) notFound();
  if (m.durum === "aktif") redirect("/panel");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center">
      <div className="glass flex h-20 w-20 items-center justify-center rounded-2xl text-4xl">
        {m.ikon}
      </div>

      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-nova-500/30 bg-nova-500/10 px-4 py-1.5 text-xs font-medium text-nova-300">
        {m.durum === "insa" ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            Şu anda inşa ediliyor
          </>
        ) : (
          "Çok yakında"
        )}
      </span>

      <h1 className="mt-4 text-2xl font-bold text-white">{m.ad}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        {m.aciklama}
      </p>

      <div className="mt-8 rounded-xl border border-slate-800 bg-surface-2 px-5 py-3 text-xs text-slate-500">
        ✓ Bu modül hazır olduğunda panelinizde otomatik aktifleşecek —
        ek kurulum gerekmez.
      </div>

      <Link
        href="/panel"
        className="mt-8 text-sm text-nova-300 transition-colors hover:text-nova-50"
      >
        ← Genel Bakış&apos;a dön
      </Link>
    </div>
  );
}
