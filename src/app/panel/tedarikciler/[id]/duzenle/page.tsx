import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TedarikciFormu } from "@/components/alis/TedarikciFormu";

export default async function TedarikciDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const { data: tedarikci } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tedarikci) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-white">Tedarikçiyi Düzenle</h1>
      <div className="glass mt-6 rounded-xl p-6">
        <TedarikciFormu tenantId={profil?.tenant_id ?? ""} mevcut={tedarikci} />
      </div>
    </div>
  );
}
