"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SifreYenilePage() {
  const router = useRouter();
  const [parola, setParola] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function parolaGuncelle(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);

    if (parola.length < 8) {
      setHata("Parola en az 8 karakter olmalı.");
      return;
    }

    setYukleniyor(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parola });
    setYukleniyor(false);

    if (error) {
      setHata(
        "Parola güncellenemedi. Bağlantının süresi dolmuş olabilir; yeniden sıfırlama isteyin."
      );
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold text-white">Yeni Parola Belirle</h1>

        <form className="mt-6 space-y-4" onSubmit={parolaGuncelle}>
          <div>
            <label
              htmlFor="parola"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Yeni parola
            </label>
            <input
              id="parola"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              placeholder="En az 8 karakter"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>

          {hata && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
          >
            {yukleniyor ? "Güncelleniyor…" : "Parolayı Güncelle"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          <Link href="/sifre-sifirla" className="text-nova-300 hover:text-nova-50">
            Yeniden sıfırlama iste
          </Link>
        </p>
      </div>
    </main>
  );
}
