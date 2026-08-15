import type { KilavuzBlok } from "@/lib/kilavuz";

function Blok({ blok }: { blok: KilavuzBlok }) {
  switch (blok.tur) {
    case "altbaslik":
      return (
        <h2 className="mt-6 text-[15px] font-semibold text-white first:mt-0">
          {blok.metin}
        </h2>
      );

    case "paragraf":
      return (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{blok.metin}</p>
      );

    case "adimlar":
      return (
        <ol className="mt-2.5 space-y-2.5">
          {blok.adimlar.map((adim, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nova-500/15 text-[11px] font-semibold text-nova-300">
                {i + 1}
              </span>
              <span>{adim}</span>
            </li>
          ))}
        </ol>
      );

    case "liste":
      return (
        <ul className="mt-2.5 space-y-2">
          {blok.ogeler.map((oge, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
              <span>{oge}</span>
            </li>
          ))}
        </ul>
      );

    case "ipucu":
      return (
        <div className="mt-3 flex gap-2.5 rounded-lg border border-nova-500/25 bg-nova-500/5 px-3.5 py-3 text-sm leading-relaxed text-nova-200">
          <span className="shrink-0">💡</span>
          <span>{blok.metin}</span>
        </div>
      );

    case "uyari":
      return (
        <div className="mt-3 flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm leading-relaxed text-amber-200">
          <span className="shrink-0">⚠️</span>
          <span>{blok.metin}</span>
        </div>
      );

    case "tablo":
      return (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-surface-2">
                {blok.basliklar.map((b, i) => (
                  <th
                    key={i}
                    className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {blok.satirlar.map((satir, i) => (
                <tr key={i}>
                  {satir.map((hucre, j) => (
                    <td
                      key={j}
                      className={`px-3.5 py-2.5 align-top leading-relaxed ${
                        j === 0 ? "font-medium text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {hucre}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function KilavuzIcerik({ icerik }: { icerik: KilavuzBlok[] }) {
  return (
    <div>
      {icerik.map((blok, i) => (
        <Blok key={i} blok={blok} />
      ))}
    </div>
  );
}
