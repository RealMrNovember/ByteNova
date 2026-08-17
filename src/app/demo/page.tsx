import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShowroomHeader from "@/components/showroom/ShowroomHeader";
import ShowroomFooter from "@/components/showroom/ShowroomFooter";
import { DemoyaGirButonu } from "@/components/showroom/DemoyaGirButonu";

export const metadata: Metadata = {
  title: "Canlı Demo — ByteNova",
  description:
    "Kayıt olmadan, gerçek örnek verilerle doldurulmuş bir ByteNova panelinde gezinin — servis, satış, stok, müşteri ve teklif modüllerini deneyin.",
};

const OZELLIKLER = [
  { ikon: "🔧", metin: "Farklı aşamalarda 3 örnek servis kaydı — kanban görünümünü deneyin" },
  { ikon: "📦", metin: "8 örnek ürünle dolu bir stok listesi" },
  { ikon: "👥", metin: "Bireysel ve kurumsal örnek müşteriler" },
  { ikon: "🧾", metin: "Tamamlanmış bir örnek satış" },
  { ikon: "📄", metin: "Kurumsal bir müşteriye gönderilmiş örnek bir teklif" },
];

export default async function DemoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex-1">
      <ShowroomHeader oturumluMu={!!user} />

      <section className="relative overflow-hidden">
        <div className="glow absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Kayıt olmadan panelimizi keşfedin
          </h1>
          <p className="mt-5 text-pretty text-base text-slate-400 sm:text-lg">
            Aşağıdaki düğmeye basınca, örnek verilerle doldurulmuş paylaşımlı
            bir demo hesabına giriş yapılır. Gerçek panelin birebir aynısı —
            istediğiniz gibi tıklayıp gezebilirsiniz.
          </p>

          <div className="mt-10">
            <DemoyaGirButonu />
          </div>

          <ul className="mx-auto mt-12 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            {OZELLIKLER.map((o) => (
              <li
                key={o.metin}
                className="glass flex items-start gap-2.5 rounded-xl p-4 text-sm text-slate-300"
              >
                <span className="text-lg">{o.ikon}</span>
                {o.metin}
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-left text-xs text-amber-200">
            <strong className="font-semibold">Not:</strong> Demo hesabı
            paylaşımlıdır — aynı anda başka ziyaretçiler de kullanıyor
            olabilir ve girdiğiniz her şey her gece sıfırlanır. Kendi
            işletmenizin verilerini saklamak için{" "}
            <Link href="/kayit" className="underline underline-offset-2 hover:text-amber-100">
              ücretsiz bir hesap açın
            </Link>
            .
          </div>
        </div>
      </section>

      <ShowroomFooter />
    </main>
  );
}
