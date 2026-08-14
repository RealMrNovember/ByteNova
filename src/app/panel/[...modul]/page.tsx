import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { efektifMenu } from "@/lib/flags";
import { fiyatGoster, type EklentiPaketi } from "@/lib/eklenti";
import { HaberVer } from "@/components/panel/HaberVer";

export default async function ModulPage({
  params,
}: {
  params: Promise<{ modul: string[] }>;
}) {
  const { modul } = await params;
  const slug = modul[0];

  const supabase = await createClient();
  const menu = await efektifMenu(supabase);
  const m = menu.find((x) => x.slug === slug);

  if (!m) notFound();
  if (m.durum === "aktif") redirect("/panel");

  const kilitli = m.durum === "kilitli";

  // Eklenti paketi bilgisi (kilitli veya ileride ücretli olacak modüller için)
  let paket: EklentiPaketi | null = null;
  if (m.addonKey) {
    const { data } = await supabase
      .from("addon_packages")
      .select("*")
      .eq("key", m.addonKey)
      .maybeSingle();
    paket = data;
  }

  // Kullanıcının tenant'ı ve mevcut haber-ver kaydı
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tenantId: string | null = null;
  let kayitli = false;

  if (user) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    tenantId = profil?.tenant_id ?? null;

    const { data: kayit } = await supabase
      .from("feature_notify_requests")
      .select("id")
      .eq("feature_key", slug)
      .eq("user_id", user.id)
      .maybeSingle();
    kayitli = !!kayit;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center">
      <div className="glass flex h-20 w-20 items-center justify-center rounded-2xl text-4xl">
        {m.ikon}
      </div>

      <span
        className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium ${
          kilitli
            ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
            : "border-nova-500/30 bg-nova-500/10 text-nova-300"
        }`}
      >
        {kilitli ? (
          "🔒 Ücretli Eklenti"
        ) : m.durum === "insa" ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            Şu anda inşa ediliyor
          </>
        ) : (
          "Çok yakında"
        )}
      </span>

      <h1 className="mt-4 text-2xl font-bold text-white">{m.ad}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        {m.aciklama}
      </p>

      {paket ? (
        <div className="glass mt-8 w-full max-w-sm rounded-2xl p-5 text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{paket.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{paket.name}</p>
              <p className="text-xs text-purple-300">{fiyatGoster(paket)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            {paket.description}
          </p>
          <Link
            href="/panel/ayarlar"
            className="mt-4 block rounded-lg bg-nova-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            Eklentiler Sayfasına Git →
          </Link>
          {!kilitli && (
            <p className="mt-3 text-center text-[11px] text-slate-600">
              Modül henüz geliştirme aşamasında. Şimdiden eklentiyi
              etkinleştirenler hazır olduğunda önceliğe girer.
            </p>
          )}
        </div>
      ) : (
        tenantId && (
          <HaberVer
            featureKey={slug}
            tenantId={tenantId}
            baslangictaKayitli={kayitli}
          />
        )
      )}

      <div className="mt-6 rounded-xl border border-slate-800 bg-surface-2 px-5 py-3 text-xs text-slate-500">
        ✓ Bu modül hazır olduğunda panelinizde otomatik aktifleşecek —
        ek kurulum gerekmez.
      </div>

      <Link
        href="/panel"
        className="mt-8 text-sm text-nova-300 transition-colors hover:text-nova-50"
      >
        ← Genel Bakış&apos;a dön
      </Link>
    </div>
  );
}
