import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ücretsiz Dene — ByteNova" };

export default function KayitPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold text-white">
          14 gün ücretsiz deneyin
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Kredi kartı gerekmez. Tüm özellikler açık.
        </p>

        <form className="mt-6 space-y-4" aria-disabled>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              İşletme adı
            </label>
            <input
              type="text"
              disabled
              placeholder="Örnek Bilgisayar & Teknik Servis"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              E-posta
            </label>
            <input
              type="email"
              disabled
              placeholder="ornek@isletme.com"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-nova-600/50 px-4 py-2.5 text-sm font-semibold text-slate-300"
          >
            Hesap Oluştur
          </button>
        </form>

        <div className="mt-5 rounded-lg border border-nova-500/25 bg-nova-500/10 px-4 py-3 text-xs leading-relaxed text-nova-300">
          🚧 Kayıt sistemi bugünlerde devreye alınıyor. Lansmandan ilk siz
          haberdar olmak için bizi takipte kalın.
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="text-nova-300 hover:text-nova-50">
            Giriş yapın
          </Link>
        </p>
      </div>
    </main>
  );
}
