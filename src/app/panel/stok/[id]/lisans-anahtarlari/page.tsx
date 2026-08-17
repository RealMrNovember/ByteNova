import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { LisansAnahtariYonetimi } from "@/components/urun/LisansAnahtariYonetimi";

export default async function LisansAnahtarlariPage({
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
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: urun } = await supabase
    .from("products")
    .select("id, name, is_digital")
    .eq("id", id)
    .maybeSingle();

  if (!urun || !urun.is_digital) notFound();

  const { data: anahtarlar } = await supabase
    .from("product_license_keys")
    .select("id, key_value, status, used_at, created_at, customers(name), sales(sale_no)")
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/panel/stok/${id}`}
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← {urun.name}
      </Link>
      <h1 className="mt-2 text-xl font-bold text-white">
        🔑 Lisans Anahtarları
      </h1>
      <p className="mt-0.5 text-sm text-slate-400">
        {urun.name} için anahtar havuzunu yönetin — her satışta bir anahtar
        otomatik rezerve edilir.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <LisansAnahtariYonetimi
          productId={id}
          yetkili={yetkili}
          anahtarlar={(anahtarlar ?? []).map((a) => ({
            id: a.id,
            key_value: a.key_value,
            status: a.status,
            used_at: a.used_at,
            created_at: a.created_at,
            musteriAdi: (a.customers as unknown as { name: string } | null)?.name ?? null,
            satisNo: (a.sales as unknown as { sale_no: string } | null)?.sale_no ?? null,
          }))}
        />
      </div>
    </div>
  );
}
