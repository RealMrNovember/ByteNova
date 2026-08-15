import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  KILAVUZ_KONULARI,
  kilavuzKonuBul,
} from "@/lib/kilavuz";
import { KilavuzIcerik } from "@/components/kilavuz/KilavuzIcerik";

export function generateStaticParams() {
  return KILAVUZ_KONULARI.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const konu = kilavuzKonuBul(slug);
  return { title: konu ? `${konu.baslik} — Kılavuz — ByteNova` : "Kılavuz — ByteNova" };
}

export default async function KilavuzKonuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const konu = kilavuzKonuBul(slug);
  if (!konu) notFound();

  const index = KILAVUZ_KONULARI.findIndex((k) => k.slug === slug);
  const onceki = index > 0 ? KILAVUZ_KONULARI[index - 1] : null;
  const sonraki = index < KILAVUZ_KONULARI.length - 1 ? KILAVUZ_KONULARI[index + 1] : null;

  const ilgiliKonular = (konu.ilgili ?? [])
    .map((s) => kilavuzKonuBul(s))
    .filter((k): k is NonNullable<typeof k> => !!k);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/panel/kilavuz"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Kullanım Kılavuzu
      </Link>

      <div className="glass mt-3 rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{konu.ikon}</span>
          <h1 className="text-lg font-bold text-white">{konu.baslik}</h1>
        </div>
        <p className="mt-1.5 text-sm text-slate-400">{konu.ozet}</p>

        <div className="mt-5 border-t border-slate-800 pt-5">
          <KilavuzIcerik icerik={konu.icerik} />
        </div>
      </div>

      {ilgiliKonular.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            İlgili Konular
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {ilgiliKonular.map((k) => (
              <Link
                key={k.slug}
                href={`/panel/kilavuz/${k.slug}`}
                className="rounded-lg border border-slate-800 bg-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-nova-500/50 hover:text-white"
              >
                {k.ikon} {k.baslik}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(onceki || sonraki) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {onceki ? (
            <Link
              href={`/panel/kilavuz/${onceki.slug}`}
              className="glass rounded-xl p-3.5 text-left transition-colors hover:border-nova-500/40"
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-500">← Önceki</p>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-200">
                {onceki.ikon} {onceki.baslik}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {sonraki ? (
            <Link
              href={`/panel/kilavuz/${sonraki.slug}`}
              className="glass rounded-xl p-3.5 text-right transition-colors hover:border-nova-500/40"
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Sonraki →</p>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-200">
                {sonraki.ikon} {sonraki.baslik}
              </p>
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );
}
