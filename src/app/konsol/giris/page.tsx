"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createKonsolClient } from "@/lib/supabase/konsol-client";
import { konsolSonrakiAdim } from "@/lib/konsol-mfa";

function KonsolGirisFormu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const hataParam = searchParams.get("hata");
  const [hata, setHata] = useState<string | null>(
    hataParam === "yetkisiz"
      ? "Bu hesabın platform admin yetkisi yok."
      : hataParam === "ip_kisitli"
        ? "Bu hesap için IP kısıtlaması tanımlı — bu ağdan erişilemiyor."
        : null
  );
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const supabase = createKonsolClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parola,
    });

    if (error) {
      setYukleniyor(false);
      setHata(
        error.message === "Invalid login credentials"
          ? "E-posta veya parola hatalı."
          : "Giriş yapılamadı. Lütfen tekrar deneyin."
      );
      return;
    }

    const { data: yetkiliMi } = await supabase.rpc("is_platform_admin");
    if (!yetkiliMi) {
      await supabase.auth.signOut();
      setYukleniyor(false);
      setHata("Bu hesabın platform admin yetkisi yok.");
      return;
    }

    const hedef = await konsolSonrakiAdim(supabase);
    router.push(hedef);
    router.refresh();
  }

  return (
    <div className="glass relative w-full max-w-md rounded-2xl p-8">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚡</span>
        <span className="text-sm font-semibold text-white">
          Byte<span className="text-nova-400">Nova</span>
        </span>
        <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
          Konsol
        </span>
      </div>
      <h1 className="mt-6 text-xl font-bold text-white">Konsol Girişi</h1>
      <p className="mt-1 text-sm text-slate-400">
        Yalnızca platform admin hesapları erişebilir — bu oturum işletme
        panelinizden tamamen bağımsızdır.
      </p>

      <form className="mt-6 space-y-4" onSubmit={girisYap}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@cicibyte.com"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="parola" className="mb-1.5 block text-xs font-medium text-slate-300">
            Parola
          </label>
          <input
            id="parola"
            type="password"
            required
            autoComplete="current-password"
            value={parola}
            onChange={(e) => setParola(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
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
          className="w-full rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-wait disabled:opacity-60"
        >
          {yukleniyor ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] text-slate-600">
        Girişten sonra MFA doğrulaması istenecektir — konsolda zorunludur.
      </p>
    </div>
  );
}

export default function KonsolGirisPage() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-surface px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <Suspense>
        <KonsolGirisFormu />
      </Suspense>
    </main>
  );
}
