"use client";

import { useState } from "react";
import { yoneticiParolaDogrula } from "@/lib/supabase/dogrulama";

type Props = {
  mesaj: string;
  onOnay: (userId: string) => void;
  onVazgec: () => void;
};

export function YoneticiOnayModal({ mesaj, onOnay, onVazgec }: Props) {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [dogrulaniyor, setDogrulaniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function dogrula() {
    if (!email.trim() || !parola) {
      setHata("E-posta ve parola girin.");
      return;
    }
    setDogrulaniyor(true);
    setHata(null);
    const sonuc = await yoneticiParolaDogrula(email.trim(), parola);
    setDogrulaniyor(false);
    if (!sonuc.ok) {
      setHata(sonuc.mesaj);
      return;
    }
    onOnay(sonuc.userId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass w-full max-w-sm rounded-xl p-5 shadow-2xl">
        <p className="text-sm font-semibold text-white">🔒 Yönetici Onayı Gerekli</p>
        <p className="mt-1.5 text-xs text-slate-400">{mesaj}</p>

        <div className="mt-4 space-y-2.5">
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Yönetici e-postası"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          <input
            type="password"
            value={parola}
            onChange={(e) => setParola(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && dogrula()}
            placeholder="Parola"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
        </div>

        {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={dogrula}
            disabled={dogrulaniyor}
            className="flex-1 rounded-lg bg-nova-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
          >
            {dogrulaniyor ? "Doğrulanıyor…" : "Onayla"}
          </button>
          <button
            onClick={onVazgec}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
