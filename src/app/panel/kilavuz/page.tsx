import type { Metadata } from "next";
import { KILAVUZ_KONULARI } from "@/lib/kilavuz";
import { KilavuzArama } from "@/components/kilavuz/KilavuzArama";

export const metadata: Metadata = { title: "Kullanım Kılavuzu — ByteNova" };

const WHATSAPP_NUMARA = "905354895050";
const DESTEK_MESAJI = encodeURIComponent(
  "Merhaba, ByteNova kullanım kılavuzunda aradığımı bulamadım, yardımcı olabilir misiniz?"
);

export default function KilavuzPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="text-3xl">📖</span>
        <h1 className="mt-2 text-xl font-bold text-white">Kullanım Kılavuzu</h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
          Takıldığınız veya anlamadığınız bir işlem mi var? Aşağıdan konuyu arayın
          ya da kategorilere göz atın.
        </p>
      </div>

      <div className="mt-6">
        <KilavuzArama konular={KILAVUZ_KONULARI} />
      </div>

      <div className="glass mt-8 rounded-xl p-5 text-center">
        <h2 className="text-sm font-semibold text-white">Aradığınızı bulamadınız mı?</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Ekibimiz size doğrudan yardımcı olsun.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMARA}?text=${DESTEK_MESAJI}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-600/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
        >
          🟢 WhatsApp&apos;tan Yazın
        </a>
      </div>
    </div>
  );
}
