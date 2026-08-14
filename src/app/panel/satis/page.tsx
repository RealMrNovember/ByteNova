import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { ODEME_YONTEMLERI_KARMA } from "@/lib/satis";
import { HizliSatis } from "@/components/satis/HizliSatis";

export const metadata: Metadata = { title: "Hızlı Satış — ByteNova" };

export default async function SatisPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  const yetkili = yetkiVar(profil?.role, "satis_yap");

  const [{ data: sonSatislar }, { data: tenant }] = await Promise.all([
    supabase
      .from("sales")
      .select("id, sale_no, total_amount, payment_method, created_at, customers(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("tenants").select("max_installments").eq("id", profil?.tenant_id ?? "").single(),
  ]);

  if (!yetkili) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Yetkiniz yok</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Satış yapma yetkisi sahip, yönetici ve kasa personeli rollerine tanımlıdır.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-white">Hızlı Satış</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          F2 → ara/barkod → miktar → ödeme
        </p>
      </div>

      <div className="mt-5">
        <HizliSatis tenantId={profil?.tenant_id ?? ""} maxTaksit={tenant?.max_installments ?? 1} />
      </div>

      {!!sonSatislar?.length && (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Son Satışlar</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {sonSatislar.map((s) => {
              const musteri = s.customers as unknown as { name: string } | null;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-slate-200">{s.sale_no}</p>
                    <p className="text-[11px] text-slate-500">
                      {musteri?.name ?? "Misafir"} · {ODEME_YONTEMLERI_KARMA[s.payment_method] ?? s.payment_method} ·{" "}
                      {new Date(s.created_at).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-200">
                    {Number(s.total_amount).toLocaleString("tr-TR")} TL
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-slate-600">
        <Link href="/panel/stok" className="hover:text-nova-300">
          Ürün eklemek veya stok görmek için Stok modülüne gidin →
        </Link>
      </p>
    </div>
  );
}
