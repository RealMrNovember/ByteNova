import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panel — ByteNova" };

const menu = [
  { ad: "Genel Bakış", durum: "insa" },
  { ad: "Servisler", durum: "insa" },
  { ad: "Satış", durum: "yakinda" },
  { ad: "Alış", durum: "yakinda" },
  { ad: "PC Toplama", durum: "yakinda" },
  { ad: "Stok", durum: "yakinda" },
  { ad: "Cihazlar", durum: "yakinda" },
  { ad: "Müşteriler", durum: "insa" },
  { ad: "Tedarikçiler", durum: "yakinda" },
  { ad: "Teklifler", durum: "yakinda" },
  { ad: "Sözleşmeler", durum: "yakinda" },
  { ad: "Finans", durum: "yakinda" },
  { ad: "Belgeler", durum: "yakinda" },
  { ad: "Raporlar", durum: "yakinda" },
  { ad: "Bildirimler", durum: "yakinda" },
  { ad: "Ayarlar", durum: "yakinda" },
] as const;

export default async function PanelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profil } = await supabase
    .from("profiles")
    .select("full_name, role, tenants(*)")
    .eq("id", user.id)
    .single();

  const tenant = profil?.tenants as unknown as {
    name: string;
    status: string;
    trial_ends_at: string;
    logo_url?: string | null;
    onboarding_completed?: boolean;
  } | null;

  // Şirket bilgileri henüz alınmadıysa kurulum ekranına yönlendir.
  // (Kolon migration'dan önce undefined kalırsa yönlendirme yapılmaz.)
  if (tenant && tenant.onboarding_completed === false) {
    redirect("/kurulum");
  }

  const kalanGun = tenant?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(tenant.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  async function cikisYap() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/giris");
  }

  return (
    <main className="relative flex-1 overflow-hidden px-4 py-10">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Üst şerit */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {tenant?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt={`${tenant.name} logosu`}
                className="h-14 w-14 rounded-xl border border-slate-700 object-contain"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                İşletme Paneli
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                {tenant?.name ?? "İşletmem"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Hoş geldin{profil?.full_name ? `, ${profil.full_name}` : ""} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tenant?.status === "trial" && kalanGun !== null && (
              <span className="rounded-full border border-nova-500/30 bg-nova-500/10 px-3.5 py-1.5 text-xs font-medium text-nova-300">
                Deneme: {kalanGun} gün kaldı
              </span>
            )}
            <form action={cikisYap}>
              <button
                type="submit"
                className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-300"
              >
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>

        {/* Durum notu */}
        <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-200/90">
          🚧 Panel her gün yeni bir modülle büyüyor. Aşağıdaki modüllerin
          ışıkları sırayla yanacak — <span className="font-medium">Servisler
          ve Müşteriler</span> ilk sırada.
        </div>

        {/* Modül ızgarası */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {menu.map((m) => (
            <div
              key={m.ad}
              className="glass flex flex-col items-center gap-2 rounded-xl px-3 py-5"
            >
              <span className="text-sm font-medium text-slate-200">{m.ad}</span>
              {m.durum === "insa" ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  İnşada
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Yakında
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm text-nova-300 hover:text-nova-50"
          >
            ← Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
