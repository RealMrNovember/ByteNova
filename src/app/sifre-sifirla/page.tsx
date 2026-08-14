"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SifreSifirlaPage() {
  const [email, setEmail] = useState("");
  const [gonderildi, setGonderildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function sifirlamaGonder(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/sifre-yenile`,
    });
    setYukleniyor(false);
    setGonderildi(true);
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold text-white">Parola Sıfırlama</h1>

        {gonderildi ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Bu e-posta ile kayıtlı bir hesap varsa sıfırlama bağlantısı
            gönderildi. Gelen kutunuzu kontrol edin.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={sifirlamaGonder}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@isletme.com"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
              />
            </div>
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
            >
              {yukleniyor ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-slate-500">
          <Link href="/giris" className="text-nova-300 hover:text-nova-50">
            ← Girişe dön
          </Link>
        </p>
      </div>
    </main>
  );
}
