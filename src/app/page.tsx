import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const moduller = [
  {
    baslik: "Servis Yönetimi",
    aciklama:
      "Kabul, fotoğraf, teşhis, müşteri onayı, kapora, teslim — cihazın tüm yaşam döngüsü kayıt altında.",
    ikon: "🔧",
  },
  {
    baslik: "Döviz Bazlı Fiyatlama",
    aciklama:
      "Dolarla al, lirayla sat. Kur değişince tüm fiyatlar ve etiketler tek ekrandan güncellenir.",
    ikon: "💵",
  },
  {
    baslik: "Satış & Kasa",
    aciklama:
      "Klavye öncelikli hızlı satış, iskonto yetkileri, karma ödeme, gün sonu kasa kapanışı.",
    ikon: "🧾",
  },
  {
    baslik: "Stok & Seri No",
    aciklama:
      "Her hareketin nedeni belli. Seri numarasıyla cihazın nereden gelip kime gittiği saniyede bulunur.",
    ikon: "📦",
  },
  {
    baslik: "Cari, Çek & Senet",
    aciklama:
      "Açık hesap, dövizli cari, vade takvimi ve nakit akış uyarıları — KOBİ gerçeklerine göre.",
    ikon: "🤝",
  },
  {
    baslik: "e-Belge & Raporlar",
    aciklama:
      "e-Fatura, e-Arşiv, gider pusulası ve ay sonunda tek tık muhasebeci paketi.",
    ikon: "📊",
  },
];

const turkiyeMaddeleri = [
  "TCMB kuru ile otomatik fiyat güncelleme",
  "ÖKC (yazarkasa POS) ve taksit gerçeği",
  "Çek/senet portföyü ve vade takibi",
  "İkinci el alımda gider pusulası",
  "PC toplama (parçadan sisteme) takibi",
  "İYS uyumlu müşteri bildirimleri",
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex-1">
      {/* Üst bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-semibold tracking-tight text-white">
              Byte<span className="text-nova-400">Nova</span>
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                href="/panel"
                className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-nova-400"
              >
                Panele Git →
              </Link>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-nova-400"
                >
                  Ücretsiz Dene
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="glow absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-nova-500/30 bg-nova-500/10 px-4 py-1.5 text-xs font-medium text-nova-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nova-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-nova-400" />
            </span>
            İnşa halinde — çok yakında sizinle
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Teknik servisin ve bilgisayarcının{" "}
            <span className="bg-gradient-to-r from-nova-300 to-nova-500 bg-clip-text text-transparent">
              yeni nesil işletim sistemi
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-slate-400 sm:text-lg">
            Servisten satışa, kurdan kasaya — WhatsApp mesajları, Excel
            dosyaları ve kâğıt fişler yerine işletmenizin tamamı tek platformda.
            Türkiye&apos;nin gerçeklerine göre yazıldı.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/kayit"
              className="w-full rounded-xl bg-nova-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-nova-500/25 transition hover:bg-nova-400 hover:shadow-nova-400/30 sm:w-auto"
            >
              Ücretsiz Denemeye Başla
            </Link>
            <Link
              href="/panel"
              className="w-full rounded-xl border border-slate-700 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-nova-500/50 hover:text-white sm:w-auto"
            >
              Paneli Keşfet
            </Link>
          </div>
        </div>
      </section>

      {/* Modüller */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Tek platform, bütün operasyon
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-400">
          Bir cihaz kapıdan girdiği anda ByteNova onun dijital yaşam döngüsünü
          başlatır.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moduller.map((m) => (
            <div key={m.baslik} className="glass rounded-2xl p-6">
              <div className="text-2xl">{m.ikon}</div>
              <h3 className="mt-4 font-semibold text-white">{m.baslik}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {m.aciklama}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Türkiye'ye özel */}
      <section className="border-y border-slate-800/60 bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                🇹🇷 Türkiye&apos;nin gerçeklerine göre yazıldı
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Yabancı yazılımların bilmediği, yerli muadillerin es geçtiği
                sahadaki gerçekler ByteNova&apos;da birinci sınıf özelliktir.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {turkiyeMaddeleri.map((madde) => (
                <li
                  key={madde}
                  className="flex items-start gap-2.5 text-sm text-slate-300"
                >
                  <span className="mt-0.5 text-nova-400">✓</span>
                  {madde}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <span>
          © {new Date().getFullYear()} CiciByte Teknoloji —{" "}
          <a
            href="https://cicibyte.com"
            className="text-slate-400 transition-colors hover:text-nova-300"
          >
            cicibyte.com
          </a>
        </span>
        <span>ByteNova • Sürüm 0.1 — her gün yeni bir özellikle büyüyor</span>
      </footer>
    </main>
  );
}
