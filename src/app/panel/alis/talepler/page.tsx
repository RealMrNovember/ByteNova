import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { TalepYonetimi, type Talep } from "@/components/alis/TalepYonetimi";

export const metadata: Metadata = { title: "Satın Alma Talepleri — ByteNova" };

export default async function TaleplerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();
  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  const { data: talepler } = await supabase
    .from("purchase_requests")
    .select("id, quantity, source, status, note, requested_at, products(id, name), service_orders(id, service_no)")
    .order("requested_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel/alis" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Alış
      </Link>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Satın Alma Talepleri</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Servisten gelen parça ihtiyaçları ve kritik stoktan otomatik oluşan talepler
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TalepYonetimi yetkili={yetkili} talepler={(talepler ?? []) as unknown as Talep[]} />
      </div>
    </div>
  );
}
