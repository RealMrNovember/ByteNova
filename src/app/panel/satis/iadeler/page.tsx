import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { IadeKontrol } from "@/components/satis/IadeKontrol";

export const metadata: Metadata = { title: "İadeler — ByteNova" };

export default async function IadelerPage() {
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

  const [{ data: bekleyenler }, { data: kasaHesaplari }] = await Promise.all([
    supabase
      .from("returns")
      .select(
        "id, return_no, quantity, reason, received_at, sales(customer_id), sale_items(name, unit_price)"
      )
      .eq("status", "alindi")
      .order("received_at", { ascending: true }),
    supabase.from("cash_accounts").select("id, name, type").eq("is_active", true).order("created_at"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/panel/satis" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Satış
      </Link>
      <h1 className="mt-1 text-xl font-bold text-white">İadeler</h1>
      <p className="mt-0.5 text-sm text-slate-400">Kontrol bekleyen iadeler</p>

      {!bekleyenler?.length ? (
        <div className="glass mt-5 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">↩️</span>
          <h2 className="mt-4 font-semibold text-white">Kontrol bekleyen iade yok</h2>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {bekleyenler.map((iade) => {
            const kalem = iade.sale_items as unknown as { name: string; unit_price: number | null } | null;
            const musteriVarMi = !!(iade.sales as unknown as { customer_id: string | null } | null)?.customer_id;
            const onerilenTutar = (kalem?.unit_price ?? 0) * iade.quantity;
            return (
              <div key={iade.id}>
                <p className="mb-1.5 text-[11px] text-slate-600">
                  {iade.return_no} · {new Date(iade.received_at).toLocaleString("tr-TR")}
                  {iade.reason && ` · ${iade.reason}`}
                </p>
                <IadeKontrol
                  returnId={iade.id}
                  urunAdi={kalem?.name ?? "—"}
                  miktar={iade.quantity}
                  onerilenTutar={onerilenTutar}
                  musteriVarMi={musteriVarMi}
                  kasaHesaplari={kasaHesaplari ?? []}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
