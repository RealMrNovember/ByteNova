import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import { sozlesmeDurumu, sozlesmeBitisineKalanGun } from "@/lib/sozlesme";

export const metadata: Metadata = { title: "Bakım Sözleşmeleri — ByteNova" };

export default async function SozlesmelerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const { data: paket } = await supabase
    .from("tenant_addon_subscriptions")
    .select("status")
    .eq("addon_key", "kurumsal_satis")
    .maybeSingle();
  const eklentiEtkin = paket?.status === "active" || paket?.status === "trial";

  if (!eklentiEtkin) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center">
        <div className="glass flex h-20 w-20 items-center justify-center rounded-2xl text-4xl">📋</div>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">
          🔒 Ücretli Eklenti
        </span>
        <h1 className="mt-4 text-2xl font-bold text-white">Sözleşmeler</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          Periyodik bakım sözleşmeleri: kapsam, SLA süresi, otomatik üretilen ziyaret takvimi ve
          sözleşme bitiş hatırlatmaları.
        </p>
        <Link
          href="/panel/ayarlar#eklentiler"
          className="mt-8 rounded-lg bg-nova-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
        >
          Kurumsal Satış Paketi'ni İncele →
        </Link>
      </div>
    );
  }

  const { data: sozlesmeler } = await supabase
    .from("maintenance_contracts")
    .select("id, contract_no, name, status, monthly_fee, currency, end_date, customers(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const yetkili = yetkiVar(profil?.role, "teklif_yonet");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sözleşmeler</h1>
          <p className="mt-0.5 text-sm text-slate-400">Periyodik bakım sözleşmeleri ve SLA takibi</p>
        </div>
        {yetkili && (
          <Link
            href="/panel/sozlesmeler/yeni"
            className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + Yeni Sözleşme
          </Link>
        )}
      </div>

      {!sozlesmeler?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">📋</span>
          <h2 className="mt-4 font-semibold text-white">Henüz sözleşme yok</h2>
          {yetkili && (
            <Link
              href="/panel/sozlesmeler/yeni"
              className="mt-6 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
            >
              + İlk sözleşmeyi oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Sözleşme No</th>
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Bitiş</th>
                <th className="px-4 py-3 text-right font-medium">Aylık Bedel</th>
                <th className="px-4 py-3 text-right font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sozlesmeler.map((s) => {
                const musteri = s.customers as unknown as { name: string } | null;
                const durumBilgi = sozlesmeDurumu(s.status);
                const kalanGun = sozlesmeBitisineKalanGun(s.end_date);
                const yakindaBitiyor = s.status === "aktif" && kalanGun >= 0 && kalanGun <= 30;
                return (
                  <tr key={s.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <Link href={`/panel/sozlesmeler/${s.id}`} className="font-mono text-xs font-medium text-nova-300">
                        {s.contract_no}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-200">{musteri?.name ?? "—"}</td>
                    <td className="hidden px-4 py-2.5 text-xs sm:table-cell">
                      <span className={yakindaBitiyor ? "font-medium text-amber-300" : "text-slate-500"}>
                        {new Date(s.end_date).toLocaleDateString("tr-TR")}
                        {yakindaBitiyor && ` · ${kalanGun} gün kaldı`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                      {s.currency === "TRY" ? paraFormatla(s.monthly_fee) : `${s.currency} ${s.monthly_fee.toLocaleString("tr-TR")}`}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durumBilgi.sinif}`}>
                        {durumBilgi.etiket}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
