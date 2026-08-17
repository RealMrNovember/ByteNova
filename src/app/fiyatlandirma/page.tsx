import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShowroomHeader from "@/components/showroom/ShowroomHeader";
import ShowroomFooter from "@/components/showroom/ShowroomFooter";

export const metadata: Metadata = {
  title: "Fiyatlandırma — ByteNova",
  description:
    "ByteNova abonelik planları ve eklenti paketleri: şeffaf aylık/yıllık fiyatlar, gizli ücret yok. İhtiyacınıza göre büyütün.",
};

function paraFormatla(tutar: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(tutar);
}

export default async function FiyatlandirmaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: planlar }, { data: eklentiler }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("key, name, monthly_price, yearly_price, max_users, included_addon_keys")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("addon_packages")
      .select("key, name, description, icon, monthly_price, billing_model")
      .eq("status", "available")
      .order("sort_order"),
  ]);

  return (
    <main className="flex-1">
      <ShowroomHeader oturumluMu={!!user} />

      <section className="relative overflow-hidden">
        <div className="glow absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Şeffaf fiyatlandırma, gizli ücret yok
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-slate-400 sm:text-lg">
            14 gün ücretsiz deneyin, kredi kartı gerekmez. İstediğiniz zaman
            plan değiştirin veya iptal edin.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {(planlar ?? []).map((p, i) => {
            const oneCikan = i === 1;
            return (
              <div
                key={p.key}
                className={`glass relative flex flex-col rounded-2xl p-8 ${
                  oneCikan ? "border-nova-500/50 ring-1 ring-nova-500/30" : ""
                }`}
              >
                {oneCikan && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-nova-500 px-3 py-1 text-[11px] font-semibold text-slate-950">
                    En çok tercih edilen
                  </span>
                )}
                <h3 className="font-semibold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {paraFormatla(p.monthly_price)}
                  </span>
                  <span className="text-sm text-slate-400">/ay</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Yıllık ödemede {paraFormatla(p.yearly_price)}/yıl
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-nova-400">✓</span>
                    {p.max_users ? `${p.max_users} kullanıcıya kadar` : "Sınırsız kullanıcı"}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-nova-400">✓</span>
                    Tüm temel modüller (servis, satış, stok, cari, raporlar)
                  </li>
                  {(p.included_addon_keys ?? []).length > 0 && (
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-nova-400">✓</span>
                      {(p.included_addon_keys as string[])
                        .map((k) => eklentiler?.find((e) => e.key === k)?.name ?? k)
                        .join(", ")}{" "}
                      dahil
                    </li>
                  )}
                </ul>
                <Link
                  href="/kayit"
                  className={`mt-8 w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition ${
                    oneCikan
                      ? "bg-nova-500 text-slate-950 hover:bg-nova-400"
                      : "border border-slate-700 text-slate-200 hover:border-nova-500/50 hover:text-white"
                  }`}
                >
                  Ücretsiz Denemeye Başla
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {(eklentiler?.length ?? 0) > 0 && (
        <section className="border-y border-slate-800/60 bg-surface-2">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              İhtiyaca göre eklentiler
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Her plana istediğiniz eklentiyi ekleyip çıkarabilirsiniz —
              iptalde veriniz silinmez.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(eklentiler ?? []).map((e) => (
                <div key={e.key} className="glass rounded-2xl p-6">
                  <div className="text-2xl">{e.icon ?? "🧩"}</div>
                  <h3 className="mt-4 font-semibold text-white">{e.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {e.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-nova-300">
                    {e.billing_model === "usage"
                      ? "Kullanıma göre ücretlendirilir"
                      : `${paraFormatla(e.monthly_price)}/ay`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Hâlâ karar veremediniz mi?
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Sık sorulan sorulara göz atın veya kayıt olmadan canlı demoyu
          deneyin.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/demo"
            className="w-full rounded-xl bg-nova-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-nova-500/25 transition hover:bg-nova-400 hover:shadow-nova-400/30 sm:w-auto"
          >
            Canlı Demoyu İncele
          </Link>
          <Link
            href="/sss"
            className="w-full rounded-xl border border-slate-700 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-nova-500/50 hover:text-white sm:w-auto"
          >
            Sık Sorulan Sorular
          </Link>
        </div>
      </section>

      <ShowroomFooter />
    </main>
  );
}
