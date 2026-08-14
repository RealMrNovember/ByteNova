"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function GirisFormu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [hata, setHata] = useState<string | null>(
    searchParams.get("hata") === "dogrulama"
      ? "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Tekrar deneyin."
      : null
  );
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parola,
    });

    if (error) {
      setYukleniyor(false);
      setHata(
        error.message === "Invalid login credentials"
          ? "E-posta veya parola hatalı."
          : error.message === "Email not confirmed"
            ? "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin."
            : "Giriş yapılamadı. Lütfen tekrar deneyin."
      );
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="glass relative w-full max-w-md rounded-2xl p-8">
      <Link href="/" className="text-lg font-semibold text-white">
        ⚡ Byte<span className="text-nova-400">Nova</span>
      </Link>
      <h1 className="mt-6 text-xl font-bold text-white">Giriş Yap</h1>
      <p className="mt-1 text-sm text-slate-400">İşletme panelinize erişin.</p>

      <form className="mt-6 space-y-4" onSubmit={girisYap}>
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
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="parola"
              className="block text-xs font-medium text-slate-300"
            >
              Parola
            </label>
            <Link
              href="/sifre-sifirla"
              className="text-xs text-slate-500 hover:text-nova-300"
            >
              Parolamı unuttum
            </Link>
          </div>
          <input
            id="parola"
            type="password"
            required
            autoComplete="current-password"
            value={parola}
            onChange={(e) => setParola(e.target.value)}
            placeholder="••••••••"
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
          {yukleniyor ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="text-nova-300 hover:text-nova-50">
          Ücretsiz deneyin
        </Link>
      </p>
    </div>
  );
}

export default function GirisPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <Suspense>
        <GirisFormu />
      </Suspense>
    </main>
  );
}
