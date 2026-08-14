import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PanelKabuk } from "@/components/panel/PanelKabuk";

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
    .select("full_name, role, tenants(*)")
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

  return (
    <PanelKabuk
      tenantAdi={tenant?.name ?? "İşletmem"}
      logoUrl={tenant?.logo_url ?? null}
      kullaniciAdi={profil?.full_name ?? "Kullanıcı"}
      email={user.email ?? ""}
      kalanGun={kalanGun}
    >
      {children}
    </PanelKabuk>
  );
}
