"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createKonsolClient } from "@/lib/supabase/konsol-client";

export default function KonsolMfaDogrulaPage() {
  const router = useRouter();
  const [faktorId, setFaktorId] = useState<string | null>(null);
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [dogrulaniyor, setDogrulaniyor] = useState(false);

  useEffect(() => {
    // listFactors() salt-okunur ve idempotent — Strict Mode'un geliştirme
    // modunda efekti iki kez çalıştırması zararsız; bir "iptal" bayrağı
    // (mfa-kur'daki gibi) burada da sonsuz "Kontrol ediliyor…" durumuna
    // yol açardı, bilerek kullanılmadı.
    async function bul() {
      const supabase = createKonsolClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      const dogrulanmis = data?.totp?.find((f) => f.status === "verified");
      if (error || !dogrulanmis) {
        router.push("/konsol/mfa-kur");
        return;
      }
      setFaktorId(dogrulanmis.id);
      setYukleniyor(false);
    }
    bul();
  }, [router]);

  async function dogrula(e: React.FormEvent) {
    e.preventDefault();
    if (!faktorId) return;
    setHata(null);
    setDogrulaniyor(true);

    const supabase = createKonsolClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: faktorId,
      code: kod.trim(),
    });

    if (error) {
      setDogrulaniyor(false);
      setHata("Kod hatalı veya süresi doldu. Tekrar deneyin.");
      return;
    }

    router.push("/konsol");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-surface px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-2xl p-8">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔐</span>
          <span className="text-sm font-semibold text-white">İki Adımlı Doğrulama</span>
        </div>
        <h1 className="mt-6 text-xl font-bold text-white">Kimliğinizi Doğrulayın</h1>
        <p className="mt-1 text-sm text-slate-400">
          Authenticator uygulamanızdaki 6 haneli kodu girin.
        </p>

        {yukleniyor ? (
          <p className="mt-6 text-sm text-slate-500">Kontrol ediliyor…</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={dogrula}>
            <div>
              <label htmlFor="kod" className="mb-1.5 block text-xs font-medium text-slate-300">
                6 haneli kod
              </label>
              <input
                id="kod"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                value={kod}
                onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-center text-lg tracking-[0.3em] text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
              />
            </div>

            {hata && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {hata}
              </div>
            )}

            <button
              type="submit"
              disabled={dogrulaniyor || kod.length !== 6}
              className="w-full rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-wait disabled:opacity-60"
            >
              {dogrulaniyor ? "Doğrulanıyor…" : "Doğrula"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
