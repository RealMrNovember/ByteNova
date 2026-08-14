import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { KullaniciYonetimi } from "@/components/panel/KullaniciYonetimi";
import { yetkiVar } from "@/lib/yetki";

export const metadata: Metadata = { title: "Ayarlar — ByteNova" };

export default async function AyarlarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, role, tenants(*)")
    .eq("id", user.id)
    .single();

  const tenant = profil?.tenants as unknown as {
    name: string;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
  } | null;

  // Aynı tenant'taki kullanıcılar (RLS zaten sınırlıyor)
  const { data: kullanicilar } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("created_at", { ascending: true });

  // Bekleyen davetler (yalnız owner/manager görebilir — RLS)
  const { data: davetler } = await supabase
    .from("invitations")
    .select("id, email, role, token")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const ayarYonetebilir = yetkiVar(profil?.role, "ayar_yonet");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-white">Ayarlar</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        İşletme bilgileri, kullanıcılar ve sistem tercihleri
      </p>

      <div className="mt-6 space-y-6">
        {/* İşletme bilgileri */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {tenant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo_url}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-slate-700 object-contain"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nova-500/15 text-lg">
                  🏪
                </span>
              )}
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {tenant?.name ?? "İşletmem"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {tenant?.phone || "Telefon eklenmedi"} •{" "}
                  {tenant?.address || "Adres eklenmedi"}
                </p>
              </div>
            </div>
            {ayarYonetebilir && (
              <Link
                href="/kurulum"
                className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
              >
                Düzenle
              </Link>
            )}
          </div>
        </div>

        {/* Kullanıcılar + davet */}
        <KullaniciYonetimi
          benimId={user.id}
          benimRol={profil?.role ?? ""}
          tenantId={profil?.tenant_id ?? ""}
          kullanicilar={kullanicilar ?? []}
          davetler={davetler ?? []}
        />

        {/* Gelecek ayar blokları */}
        <div className="glass rounded-xl p-5 opacity-60">
          <h2 className="text-sm font-semibold text-slate-300">
            Vergi & e-Belge, Yazıcılar, Entegrasyonlar
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Bu ayar blokları ilgili modüllerle birlikte aktifleşecek.
          </p>
        </div>
      </div>
    </div>
  );
}
