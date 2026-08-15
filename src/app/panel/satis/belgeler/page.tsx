import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import { SatisBelgesi } from "@/components/satis/SatisBelgesi";

export const metadata: Metadata = { title: "Belge Kuyruğu — ByteNova" };

export default async function BelgeKuyruguPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const yetkili = yetkiVar(profil?.role, "satis_yap");

  if (!yetkili) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Yetkiniz yok</h1>
      </div>
    );
  }

  const { data: bekleyenler } = await supabase
    .from("sales")
    .select("id, sale_no, total_amount, created_at, customers(name)")
    .eq("document_type", "sonra_kesilecek")
    .is("document_issued_at", null)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/panel/satis" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Satış
      </Link>
      <h1 className="mt-1 text-xl font-bold text-white">Belge Kuyruğu</h1>
      <p className="mt-0.5 text-sm text-slate-400">Belgesi henüz kesilmemiş satışlar</p>

      {!bekleyenler?.length ? (
        <div className="glass mt-5 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">🧾</span>
          <h2 className="mt-4 font-semibold text-white">Bekleyen belge yok</h2>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {bekleyenler.map((s) => {
            const musteri = s.customers as unknown as { name: string } | null;
            return (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-600">
                  <Link href={`/panel/satis/${s.id}`} className="font-mono hover:text-nova-300">
                    {s.sale_no}
                  </Link>
                  <span>
                    {musteri?.name ?? "Misafir"} · {paraFormatla(s.total_amount)} ·{" "}
                    {new Date(s.created_at).toLocaleString("tr-TR")}
                  </span>
                </div>
                <SatisBelgesi saleId={s.id} yetkili={yetkili} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
