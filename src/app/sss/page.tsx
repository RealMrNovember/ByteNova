import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShowroomHeader from "@/components/showroom/ShowroomHeader";
import ShowroomFooter from "@/components/showroom/ShowroomFooter";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular — ByteNova",
  description:
    "ByteNova hakkında merak edilenler: ücretsiz deneme, veri aktarımı, güvenlik, iptal koşulları ve destek.",
};

const SORULAR: { soru: string; cevap: string }[] = [
  {
    soru: "Ücretsiz deneme nasıl işliyor, kredi kartı gerekiyor mu?",
    cevap:
      "Kayıt olduğunuzda 14 gün boyunca tüm temel modülleri kredi kartı bilgisi vermeden kullanabilirsiniz. Deneme süresi bittiğinde işletmenize uygun bir plan seçip devam edersiniz — otomatik ücretlendirme yoktur.",
  },
  {
    soru: "Eski programımdaki/Excel'imdeki verileri ByteNova'ya nasıl taşırım?",
    cevap:
      "Ayarlar > Veri İçe Aktarma bölümünden müşteri, ürün, cihaz ve açık servis kayıtlarınızı .xlsx dosyasından toplu olarak yükleyebilirsiniz. Sihirbaz sütunlarınızı otomatik eşler, siz doğrularsınız; hatalı satırlar diğerlerini etkilemeden ayrıca raporlanır.",
  },
  {
    soru: "Verilerim güvende mi, kim erişebilir?",
    cevap:
      "Her işletmenin verisi veritabanı seviyesinde diğer işletmelerden tamamen izole tutulur (satır bazlı güvenlik). Verileriniz yalnızca sizin ve yetkilendirdiğiniz kullanıcılarınız tarafından görülebilir; ByteNova ekibi destek talebiniz olmadan işletme verinize erişmez.",
  },
  {
    soru: "Birden fazla kullanıcı ve rol tanımlayabilir miyim?",
    cevap:
      "Evet. Plana göre kullanıcı sayısı değişir; her kullanıcıya Sahip, Yönetici, Kasa Personeli, Teknisyen, Depo Personeli veya Muhasebe rollerinden birini atayabilir, kimin neyi görüp yapabileceğini rol bazlı sınırlayabilirsiniz.",
  },
  {
    soru: "Döviz bazlı alış/satış gerçekten destekleniyor mu?",
    cevap:
      "Evet — dolar/euro ile alıp lirayla satan işletmeler için tasarlandı. TCMB kurunu tek tıkla çeker, alış anındaki kur donar, satış fiyatları güncel kura göre otomatik hesaplanır.",
  },
  {
    soru: "İnternetim kesilirse ne olur?",
    cevap:
      "ByteNova bulut tabanlı bir web uygulamasıdır, çalışması için internet bağlantısı gerekir. Kısa kesintilerde son ekran tarayıcınızda kalır; bağlantı geri geldiğinde kaldığınız yerden devam edersiniz.",
  },
  {
    soru: "İstediğim zaman iptal edebilir miyim, verilerim silinir mi?",
    cevap:
      "Aboneliğinizi istediğiniz zaman durdurabilirsiniz. İptal ettiğinizde verileriniz otomatik silinmez; hesabınızı yeniden etkinleştirirseniz kaldığınız yerden devam edersiniz. Kalıcı silme talebi için destek hattından bize ulaşmanız yeterli.",
  },
  {
    soru: "Yazarkasa (ÖKC) veya e-Fatura entegrasyonu var mı?",
    cevap:
      "e-Belge (e-Fatura/e-Arşiv) ve ÖKC entegrasyonları yol haritamızda ilerleyen sıradadır — Modüller sayfasından güncel durumu takip edebilirsiniz. Bugün itibarıyla fiş/fatura seçimli manuel belge akışı ve sonradan kesim işaretleme kullanılabilir.",
  },
  {
    soru: "Destek almak istersem ne yapmalıyım?",
    cevap:
      "Panel içindeki Ayarlar sayfasının altındaki WhatsApp destek hattından doğrudan ekibimize ulaşabilirsiniz. Ayrıca panel içi Kılavuz bölümünde modül bazlı adım adım rehberler bulunur.",
  },
];

export default async function SssPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SORULAR.map((s) => ({
      "@type": "Question",
      name: s.soru,
      acceptedAnswer: { "@type": "Answer", text: s.cevap },
    })),
  };

  return (
    <main className="flex-1">
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShowroomHeader oturumluMu={!!user} />

      <section className="relative overflow-hidden">
        <div className="glow absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Sık Sorulan Sorular
          </h1>
          <p className="mt-5 text-pretty text-base text-slate-400 sm:text-lg">
            Aradığınızı bulamazsanız WhatsApp destek hattımızdan bize
            ulaşabilirsiniz.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="space-y-3">
          {SORULAR.map((s) => (
            <details
              key={s.soru}
              className="glass group rounded-xl px-5 py-4 open:pb-5"
            >
              <summary className="cursor-pointer list-none font-medium text-slate-200 marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {s.soru}
                  <span className="shrink-0 text-nova-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {s.cevap}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800/60 bg-surface-2">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Denemeye hazır mısınız?
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/kayit"
              className="w-full rounded-xl bg-nova-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-nova-500/25 transition hover:bg-nova-400 hover:shadow-nova-400/30 sm:w-auto"
            >
              Ücretsiz Denemeye Başla
            </Link>
            <Link
              href="/demo"
              className="w-full rounded-xl border border-slate-700 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-nova-500/50 hover:text-white sm:w-auto"
            >
              Canlı Demoyu İncele
            </Link>
          </div>
        </div>
      </section>

      <ShowroomFooter />
    </main>
  );
}
