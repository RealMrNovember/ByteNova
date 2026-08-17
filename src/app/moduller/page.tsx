import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShowroomHeader from "@/components/showroom/ShowroomHeader";
import ShowroomFooter from "@/components/showroom/ShowroomFooter";
import { PANEL_MENU } from "@/lib/menu";

export const metadata: Metadata = {
  title: "Modüller — ByteNova",
  description:
    "ByteNova'nın servis, satış, stok, cari, teklif ve raporlama modüllerini tek sayfada inceleyin — hangileri şimdi kullanılabilir, hangileri yakında geliyor.",
};

const ADDON_ADLARI: Record<string, string> = {
  pc_toplama: "PC Toplama eklentisi",
  kurumsal_satis: "Kurumsal Satış Paketi eklentisi",
  e_belge: "e-Belge eklentisi",
  pazaryeri: "Pazaryeri Entegrasyonu eklentisi",
  whatsapp_sms: "WhatsApp/SMS eklentisi",
};

export default async function ModullerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aktifModuller = PANEL_MENU.filter((m) => m.durum === "aktif");
  const yakindaModuller = PANEL_MENU.filter((m) => m.durum !== "aktif");

  return (
    <main className="flex-1">
      <ShowroomHeader oturumluMu={!!user} />

      <section className="relative overflow-hidden">
        <div className="glow absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Bir işletmeyi çalıştırmak için gereken her şey
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-slate-400 sm:text-lg">
            Servis kabulünden kasa kapanışına, teklif hazırlamaktan
            muhasebeci paketine — {aktifModuller.length} modül şu anda
            kullanımda, {yakindaModuller.length} modül yol haritasında.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          Şu anda kullanımda
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aktifModuller.map((m) => (
            <div key={m.slug} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{m.ikon}</div>
                {m.addonKey && (
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
                    Eklenti
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-semibold text-white">{m.ad}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {m.aciklama}
              </p>
              {m.addonKey && (
                <p className="mt-3 text-xs text-purple-300">
                  {ADDON_ADLARI[m.addonKey] ?? "Eklentiye bağlı"}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800/60 bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Yol haritasında — sırayla açılıyor
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Pilot işletmelerin geri bildirimine göre sıra değişebilir.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {yakindaModuller.map((m) => (
              <div
                key={m.slug}
                className="rounded-2xl border border-dashed border-slate-700 p-6 opacity-80"
              >
                <div className="text-2xl grayscale">{m.ikon}</div>
                <h3 className="mt-4 font-semibold text-slate-200">{m.ad}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {m.aciklama}
                </p>
                {m.addonKey && (
                  <p className="mt-3 text-xs text-slate-500">
                    Açıldığında: {ADDON_ADLARI[m.addonKey] ?? "eklentiye bağlı"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Hepsini panelde görmek ister misiniz?
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
      </section>

      <ShowroomFooter />
    </main>
  );
}
