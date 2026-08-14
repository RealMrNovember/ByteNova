import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { hesapEtiket, hesapIkon, kasaHareketEtiket, kasaHareketIkon } from "@/lib/kasa";
import { paraFormatla } from "@/lib/doviz";
import { KasaKapat } from "@/components/finans/KasaKapat";

export const metadata: Metadata = { title: "Kasa Hesabı — ByteNova" };

export default async function KasaHesabiPage({
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

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const kasaYetkili = yetkiVar(profil?.role, "kasa_yonet");
  if (!kasaYetkili) redirect("/panel/finans");

  const { data: hesap } = await supabase
    .from("cash_accounts")
    .select("id, name, type, balance, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!hesap) notFound();

  // "sv-SE" biçimi YYYY-MM-DD üretir; Postgres'teki kasa_kapat() de
  // aynı şekilde Europe/Istanbul saatine göre "bugün"ü hesaplıyor.
  const bugun = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

  const [{ data: hareketler }, { data: bugunkuKapanis }, { data: gecmisKapanislar }] = await Promise.all([
    supabase
      .from("cash_movements")
      .select("id, movement_type, amount, balance_before, balance_after, reference_type, reason, created_at")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("cash_closings")
      .select("id")
      .eq("account_id", id)
      .eq("closing_date", bugun)
      .is("reversed_at", null)
      .maybeSingle(),
    supabase
      .from("cash_closings")
      .select("id, closing_date, expected_balance, actual_balance, difference, explanation, reversed_at, reversal_reason")
      .eq("account_id", id)
      .order("closing_date", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/panel/finans" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Finans
      </Link>

      <div className="glass mt-3 rounded-xl p-5 text-center">
        <span className="text-2xl">{hesapIkon(hesap.type)}</span>
        <h1 className="mt-1.5 text-lg font-bold text-white">{hesap.name}</h1>
        <p className="text-xs text-slate-500">
          {hesapEtiket(hesap.type)}
          {!hesap.is_active && " · Pasif"}
        </p>
        <p className="mt-3 text-3xl font-bold text-nova-300">{paraFormatla(hesap.balance)}</p>
      </div>

      <div className="mt-4">
        <KasaKapat
          accountId={hesap.id}
          beklenenBakiye={hesap.balance}
          bugunKapandiMi={!!bugunkuKapanis}
          yetkili={kasaYetkili}
        />
      </div>

      {!!gecmisKapanislar?.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Kapanış Geçmişi</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {gecmisKapanislar.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-sm text-slate-200">
                    {new Date(`${k.closing_date}T12:00:00`).toLocaleDateString("tr-TR")}
                    {k.reversed_at && (
                      <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        Geri alındı
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Beklenen {paraFormatla(k.expected_balance)} · Fiili {paraFormatla(k.actual_balance)}
                    {k.explanation && ` — ${k.explanation}`}
                  </p>
                  {k.reversed_at && (
                    <p className="mt-0.5 text-[11px] text-amber-300">
                      ByteNova destek tarafından geri alındı — {k.reversal_reason}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    k.difference === 0
                      ? "text-slate-500"
                      : k.difference > 0
                        ? "text-emerald-300"
                        : "text-red-300"
                  }`}
                >
                  {k.difference > 0 ? "+" : ""}
                  {paraFormatla(k.difference)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Hareketler</h2>
        </div>
        {!hareketler?.length ? (
          <p className="px-4 py-10 text-center text-sm text-slate-600">Henüz hareket yok.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {hareketler.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-base">{kasaHareketIkon(h.movement_type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">
                    {kasaHareketEtiket(h.movement_type)}
                    {h.reason && <span className="text-slate-500"> — {h.reason}</span>}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {paraFormatla(h.balance_before)} → {paraFormatla(h.balance_after)} ·{" "}
                    {new Date(h.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    h.amount > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {h.amount > 0 ? "+" : ""}
                  {paraFormatla(h.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
