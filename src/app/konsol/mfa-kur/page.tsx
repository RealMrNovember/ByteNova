"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createKonsolClient } from "@/lib/supabase/konsol-client";

export default function KonsolMfaKurPage() {
  const router = useRouter();
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  const [qrKod, setQrKod] = useState<string | null>(null);
  const [gizliAnahtar, setGizliAnahtar] = useState<string | null>(null);
  const [faktorId, setFaktorId] = useState<string | null>(null);
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [dogrulaniyor, setDogrulaniyor] = useState(false);
  const baslatildiRef = useRef(false);

  useEffect(() => {
    // React Strict Mode geliştirme modunda effect'i iki kez çalıştırır;
    // enroll() tek seferlik bir yan etkidir (aynı isimde ikinci faktör
    // "mfa_factor_name_conflict" ile çakışır) — ref ile korunuyor.
    if (baslatildiRef.current) return;
    baslatildiRef.current = true;

    // Not: burada bilerek bir "iptal" (cleanup) bayrağıyla erken çıkış
    // yapılmıyor. React Strict Mode geliştirme modunda mount→cleanup→mount
    // adımını senkron biçimde simüle eder; bir cleanup bayrağı bu akışı
    // enroll() çağrısına ulaşmadan (sahte) iptal edip sayfayı sonsuza kadar
    // "Hazırlanıyor…" durumunda bırakırdı. baslatildiRef zaten bu efektin
    // gerçekte yalnız bir kez çalışmasını garanti ediyor.
    async function kur() {
      try {
        const supabase = createKonsolClient();

        // Yarım kalmış (doğrulanmamış) önceki kurulum denemeleri varsa
        // QR/gizli anahtarları artık geri alınamaz — temizleyip sıfırdan
        // kuruyoruz.
        const { data: mevcut } = await supabase.auth.mfa.listFactors();
        const yarimKalanlar = (mevcut?.all ?? []).filter(
          (f) => f.factor_type === "totp" && f.status === "unverified"
        );
        for (const f of yarimKalanlar) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }

        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (error || !data) {
          setDurum("hata");
          setHata("MFA kurulumu başlatılamadı. Sayfayı yenileyip tekrar deneyin.");
          return;
        }
        setFaktorId(data.id);
        // qr_code ham SVG olarak döner — <img> için data URI'ye sarılıyor.
        setQrKod(`data:image/svg+xml;utf8,${encodeURIComponent(data.totp.qr_code)}`);
        setGizliAnahtar(data.totp.secret);
        setDurum("hazir");
      } catch (e) {
        setDurum("hata");
        setHata("Beklenmeyen bir hata oluştu: " + String(e));
      }
    }
    kur();
  }, []);

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
      setHata("Kod hatalı veya süresi doldu. Authenticator uygulamanızdaki güncel kodu girin.");
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
          <span className="text-sm font-semibold text-white">MFA Kurulumu</span>
        </div>
        <h1 className="mt-6 text-xl font-bold text-white">İki Adımlı Doğrulama Zorunlu</h1>
        <p className="mt-1 text-sm text-slate-400">
          Konsola erişebilmek için Google Authenticator, Authy veya benzeri bir
          uygulamayla bu hesabı eşleştirmeniz gerekir.
        </p>

        {durum === "yukleniyor" && (
          <p className="mt-6 text-sm text-slate-500">Hazırlanıyor…</p>
        )}

        {durum === "hata" && (
          <div className="mt-6 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {hata}
          </div>
        )}

        {durum === "hazir" && (
          <>
            <div className="mt-6 flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrKod ?? undefined}
                alt="MFA QR kodu"
                className="h-44 w-44 rounded-xl border border-slate-700 bg-white p-2"
              />
              {gizliAnahtar && (
                <p className="break-all text-center font-mono text-[11px] text-slate-500">
                  Manuel giriş: {gizliAnahtar}
                </p>
              )}
            </div>

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
                {dogrulaniyor ? "Doğrulanıyor…" : "Doğrula ve Etkinleştir"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
