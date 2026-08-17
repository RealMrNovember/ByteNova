import type { Metadata } from "next";
import { createKonsolClient } from "@/lib/supabase/konsol-server";
import { AdminYonetimi } from "@/components/konsol/AdminYonetimi";

export const metadata: Metadata = { title: "Adminler — Konsol — ByteNova" };

export default async function KonsolAdminlerPage() {
  const supabase = await createKonsolClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: adminler }, { data: davetler }, { data: benimProfil }] = await Promise.all([
    supabase.rpc("admin_platform_admin_listesi"),
    supabase
      .from("platform_admin_invitations")
      .select("id, email, role, expires_at, created_at")
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
    user ? supabase.from("platform_admins").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <AdminYonetimi
      adminler={adminler ?? []}
      davetler={davetler ?? []}
      benimId={user?.id ?? ""}
      benimRolMasterMi={benimProfil?.role === "master"}
    />
  );
}
