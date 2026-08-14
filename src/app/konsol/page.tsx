import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { tenantDurum, type TenantSatiri } from "@/lib/konsol";

export const metadata: Metadata = { title: "Konsol — ByteNova" };

export default async function KonsolPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.rpc("admin_tenant_listesi");
  const tumTenantlar = (data as TenantSatiri[]) ?? [];

  const aranan = q?.trim().toLocaleLowerCase("tr");
  const tenantlar = aranan
    ? tumTenantlar.filter(
        (t) =>
          t.name.toLocaleLowerCase("tr").includes(aranan) ||
          t.owner_email?.toLocaleLowerCase("tr").includes(aranan) ||
          t.owner_name?.toLocaleLowerCase("tr").includes(aranan)
      )
    : tumTenantlar;

  const buHafta = new Date();
  buHafta.setDate(buHafta.getDate() - 7);
  const yeniKayit = tumTenantlar.filter(
    (t) => new Date(t.created_at) > buHafta
  ).length;
  const denemede = tumTenantlar.filter((t) => t.status === "trial").length;
  const aktif = tumTenantlar.filter((t) => t.status === "active").length;

  const kartlar = [
    { etiket: "Toplam İşletme", deger: tumTenantlar.length, ikon: "🏢" },
    { etiket: "Son 7 Günde Yeni", deger: yeniKayit, ikon: "✨" },
    { etiket: "Deneme Sürecinde", deger: denemede, ikon: "⏳" },
    { etiket: "Aktif Abonelik", deger: aktif, ikon: "💳" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Tenant Listesi</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        ByteNova&apos;ya kayıt olan tüm işletmeler
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartlar.map((k) => (
          <div key={k.etiket} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                {k.etiket}
              </span>
              <span className="text-base">{k.ikon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{k.deger}</p>
          </div>
        ))}
      </div>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 İşletme adı, sahip adı veya e-posta ile ara…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
        />
      </form>

      {tenantlar.length === 0 ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">🏢</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz kayıtlı işletme yok"}
          </h2>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">İşletme</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Sahip
                </th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Kullanıcı
                </th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">
                  Kayıt
                </th>
                <th className="px-4 py-3 text-right font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenantlar.map((t) => {
                const durum = tenantDurum(t.status);
                const kalanGun =
                  t.status === "trial" && t.trial_ends_at
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(t.trial_ends_at).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : null;
                return (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/konsol/${t.id}`}
                        className="font-medium text-slate-200 hover:text-purple-300"
                      >
                        🏢 {t.name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2.5 text-xs text-slate-400 md:table-cell">
                      {t.owner_name ?? "—"}
                      {t.owner_email && (
                        <span className="block text-slate-600">
                          {t.owner_email}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-400 sm:table-cell">
                      {t.kullanici_sayisi}
                    </td>
                    <td className="hidden px-4 py-2.5 text-xs text-slate-500 lg:table-cell">
                      {new Date(t.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durum.sinif}`}
                      >
                        {durum.etiket}
                        {kalanGun !== null && ` · ${kalanGun}g`}
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
