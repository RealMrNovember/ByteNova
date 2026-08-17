import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { efektifMenu } from "@/lib/flags";
import { etkinKurlar, TAKIP_EDILEN_KURLAR } from "@/lib/doviz";
import { PanelKabuk } from "@/components/panel/PanelKabuk";
import { AbonelikBekliyorEkrani } from "@/components/panel/AbonelikBekliyorEkrani";
import { yetkiVar } from "@/lib/yetki";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profil } = await supabase
    .from("profiles")
    .select("full_name, role, tenant_id, tenants(*)")
    .eq("id", user.id)
    .single();

  const tenant = profil?.tenants as unknown as {
    name: string;
    status: string;
    trial_ends_at: string;
    logo_url: string | null;
    onboarding_completed: boolean;
  } | null;

  // Şirket bilgileri alınmadıysa önce kurulum
  if (tenant && tenant.onboarding_completed === false) {
    redirect("/kurulum");
  }

  // Askıya alınmış tenant: panel tamamen kilitlenir, "Aboneliğiniz
  // beklemede" ekranı gösterilir (Bölüm 65 — veri asla silinmez, yalnız
  // erişim durur). Sahip/yönetici burada doğrudan dekont yükleyebilir.
  if (tenant && tenant.status === "suspended") {
    return (
      <AbonelikBekliyorEkrani
        tenantId={profil?.tenant_id ?? ""}
        yukleyebilir={yetkiVar(profil?.role, "ayar_yonet")}
      />
    );
  }

  const kalanGun =
    tenant?.status === "trial" && tenant.trial_ends_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(tenant.trial_ends_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const menu = await efektifMenu(supabase);
  const kurlar = await etkinKurlar(supabase);
  const kurListesi = TAKIP_EDILEN_KURLAR.map((kod) => ({
    kod,
    kur: kurlar.get(kod)?.rate_to_try ?? null,
  }));

  // Platform admin ise profil menüsünde Konsol'a giden bir bağlantı
  // gösterilecek — aksi halde /konsol URL'i bilinmeden erişilemez.
  const { data: platformAdminMi } = await supabase.rpc("is_platform_admin");

  return (
    <PanelKabuk
      menuOgeleri={menu}
      tenantAdi={tenant?.name ?? "İşletmem"}
      logoUrl={tenant?.logo_url ?? null}
      kullaniciAdi={profil?.full_name ?? "Kullanıcı"}
      email={user.email ?? ""}
      kalanGun={kalanGun}
      kurlar={kurListesi}
      platformAdminMi={!!platformAdminMi}
    >
      {children}
    </PanelKabuk>
  );
}
