"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function KayitPage() {
  const [isletmeAdi, setIsletmeAdi] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  async function kayitOl(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);

    if (parola.length < 8) {
      setHata("Parola en az 8 karakter olmalı.");
      return;
    }

    setYukleniyor(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: parola,
      options: {
        data: { business_name: isletmeAdi, full_name: adSoyad },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setYukleniyor(false);

    if (error) {
      setHata(
        error.message.includes("already registered")
          ? "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin."
          : "Kayıt tamamlanamadı. Lütfen tekrar deneyin."
      );
      return;
    }

    setTamamlandi(true);
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>

        {tamamlandi ? (
          <div className="mt-6">
            <h1 className="text-xl font-bold text-white">
              📬 E-postanızı kontrol edin
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              <span className="text-slate-200">{email}</span> adresine bir
              doğrulama bağlantısı gönderdik. Bağlantıya tıkladığınızda
              işletmeniz oluşturulacak ve panelinize yönlendirileceksiniz.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              E-posta gelmediyse spam klasörünü kontrol edin.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-xl font-bold text-white">
              14 gün ücretsiz deneyin
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Kredi kartı gerekmez. Tüm özellikler açık.
            </p>

            <form className="mt-6 space-y-4" onSubmit={kayitOl}>
              <div>
                <label
                  htmlFor="isletme"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  İşletme adı
                </label>
                <input
                  id="isletme"
                  type="text"
                  required
                  value={isletmeAdi}
                  onChange={(e) => setIsletmeAdi(e.target.value)}
                  placeholder="Örnek Bilgisayar & Teknik Servis"
                  className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
                />
              </div>
              <div>
                <label
                  htmlFor="adsoyad"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Ad Soyad
                </label>
                <input
                  id="adsoyad"
                  type="text"
                  required
                  autoComplete="name"
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
                />
              </div>
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
                <label
                  htmlFor="parola"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Parola
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
                {yukleniyor ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500">
              Zaten hesabınız var mı?{" "}
              <Link href="/giris" className="text-nova-300 hover:text-nova-50">
                Giriş yapın
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
