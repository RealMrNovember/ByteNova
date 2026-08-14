"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const HATA_MESAJLARI: Record<string, string> = {
  davet_gecersiz:
    "Bu davet geçersiz, süresi dolmuş veya daha önce kullanılmış. İşletme sahibinden yeni bir davet isteyin.",
  eposta_uyusmuyor:
    "Bu davet başka bir e-posta adresine gönderilmiş. Davetin gönderildiği adresle giriş yaptığınızdan emin olun.",
  oturum_yok: "Oturumunuz bulunamadı. Lütfen yeniden giriş yapın.",
};

export function DavetKabul({ token }: { token: string }) {
  const router = useRouter();
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kabulEt() {
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("daveti_kabul_et", {
      p_token: token,
    });

    setYukleniyor(false);

    if (error) {
      setHata("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
      return;
    }

    const sonuc = data as { ok: boolean; hata?: string };
    if (!sonuc.ok) {
      setHata(HATA_MESAJLARI[sonuc.hata ?? ""] ?? "Davet kabul edilemedi.");
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="mt-4">
      <p className="text-sm leading-relaxed text-slate-400">
        Bir işletme sizi ekibine davet etti. Kabul ettiğinizde bu işletmenin
        paneline katılacaksınız.
      </p>

      {hata && (
        <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {hata}
        </div>
      )}

      <button
        onClick={kabulEt}
        disabled={yukleniyor}
        className="mt-6 w-full rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
      >
        {yukleniyor ? "Katılıyorsunuz…" : "✓ Daveti Kabul Et"}
      </button>
    </div>
  );
}
