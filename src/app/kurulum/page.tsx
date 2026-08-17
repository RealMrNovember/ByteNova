import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KurulumSihirbazi } from "@/components/kurulum/KurulumSihirbazi";

export default async function KurulumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(*)")
    .eq("id", user.id)
    .single();

  const tenantId = profil?.tenant_id;
  if (!tenantId) redirect("/giris");

  const tenant = profil?.tenants as unknown as {
    name?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
  } | null;

  const [{ data: sube }, { count: kasaSayisi }] = await Promise.all([
    supabase.from("branches").select("id, name").eq("tenant_id", tenantId).eq("is_default", true).maybeSingle(),
    supabase.from("cash_accounts").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <KurulumSihirbazi
        tenantId={tenantId}
        isletmeAdiBaslangic={tenant?.name && tenant.name !== "İşletmem" ? tenant.name : ""}
        telefonBaslangic={tenant?.phone ?? ""}
        adresBaslangic={tenant?.address ?? ""}
        logoBaslangic={tenant?.logo_url ?? null}
        subeId={sube?.id ?? null}
        subeAdiBaslangic={sube?.name ?? "Merkez"}
        kasaVarMi={(kasaSayisi ?? 0) > 0}
      />
    </main>
  );
}
