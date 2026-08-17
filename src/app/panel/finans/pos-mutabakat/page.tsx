import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import { PosMutabakati } from "@/components/finans/PosMutabakati";

export const metadata: Metadata = { title: "POS Mutabakat — ByteNova" };

export default async function PosMutabakatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const yetkili = yetkiVar(profil?.role, "ayar_yonet");
  if (!yetkili) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Yetkiniz yok</h1>
        <p className="mt-1.5 text-sm text-slate-400">POS mutabakatı yalnız Sahip/Yönetici yapabilir.</p>
      </div>
    );
  }

  const { data: posHesaplari } = await supabase
    .from("cash_accounts")
    .select("id, name")
    .eq("type", "pos")
    .eq("is_active", true)
    .order("created_at");

  const { data: gecmis } = await supabase
    .from("pos_settlements")
    .select("id, settlement_date, expected_amount, received_amount, commission_amount, status, cash_accounts(name)")
    .order("settlement_date", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-white">POS Mutabakat</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Gün sonu POS toplamı ile bankaya geçen tutarı eşleştirin — komisyon farkı otomatik gider
        olarak işlenir.
      </p>

      {!posHesaplari?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">💳</span>
          <h2 className="mt-4 font-semibold text-white">Henüz POS hesabı yok</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            Finans sayfasından tür olarak &quot;POS&quot; seçili bir kasa hesabı oluşturun.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <PosMutabakati posHesaplari={posHesaplari} />
        </div>
      )}

      {!!gecmis?.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Geçmiş</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {gecmis.map((g) => {
              const hesap = g.cash_accounts as unknown as { name: string } | null;
              return (
                <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">
                      {hesap?.name ?? "—"}{" "}
                      <span className="text-slate-500">
                        · {new Date(`${g.settlement_date}T12:00:00`).toLocaleDateString("tr-TR")}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Beklenen {paraFormatla(g.expected_amount)} → Alınan {paraFormatla(g.received_amount)}
                      {g.commission_amount > 0 && ` · Komisyon ${paraFormatla(g.commission_amount)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      g.status === "eslesti"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {g.status === "eslesti" ? "Eşleşti" : "Fark Var"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-600">
        <Link href="/panel/finans" className="hover:text-nova-300">
          ← Finans
        </Link>
      </p>
    </div>
  );
}
