import Link from "next/link";
import type { Metadata } from "next";
import { createKonsolClient } from "@/lib/supabase/konsol-server";
import { ROL_ADLARI, type Rol } from "@/lib/yetki";

export const metadata: Metadata = { title: "Kullanıcılar — Konsol — ByteNova" };

type KullaniciSatiri = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  platform_rolu: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

const PLATFORM_ROL_ADLARI: Record<string, string> = {
  master: "Master Admin",
  manager: "Yönetici",
  finance: "Finans",
  support: "Destek",
  analyst: "Analist",
};

export default async function KonsolKullanicilarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createKonsolClient();

  const { data } = await supabase.rpc("admin_kullanici_listesi");
  const tumKullanicilar = (data as KullaniciSatiri[]) ?? [];

  const aranan = q?.trim().toLocaleLowerCase("tr");
  const kullanicilar = aranan
    ? tumKullanicilar.filter(
        (k) =>
          k.email.toLocaleLowerCase("tr").includes(aranan) ||
          k.full_name?.toLocaleLowerCase("tr").includes(aranan) ||
          k.tenant_name.toLocaleLowerCase("tr").includes(aranan)
      )
    : tumKullanicilar;

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Kullanıcılar</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        ByteNova&apos;ya kayıt olan tüm işletmelerdeki {tumKullanicilar.length} kullanıcı
      </p>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Ad, e-posta veya işletme adıyla ara…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
        />
      </form>

      {kullanicilar.length === 0 ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">👥</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz kullanıcı yok"}
          </h2>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Kullanıcı</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">İşletme</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Rol</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Kayıt</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Son Giriş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {kullanicilar.map((k) => (
                <tr key={k.id} className="transition-colors hover:bg-slate-800/30">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-200">{k.full_name ?? "İsimsiz"}</p>
                    <p className="text-xs text-slate-500">{k.email}</p>
                    {k.platform_rolu && (
                      <span className="mt-1 inline-block rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                        🛡️ {PLATFORM_ROL_ADLARI[k.platform_rolu] ?? k.platform_rolu}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-2.5 md:table-cell">
                    <Link
                      href={`/konsol/${k.tenant_id}`}
                      className="text-slate-300 hover:text-purple-300"
                    >
                      🏢 {k.tenant_name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-2.5 text-slate-400 sm:table-cell">
                    {ROL_ADLARI[k.role as Rol] ?? k.role}
                  </td>
                  <td className="hidden px-4 py-2.5 text-xs text-slate-500 lg:table-cell">
                    {new Date(k.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="hidden px-4 py-2.5 text-xs text-slate-500 lg:table-cell">
                    {k.last_sign_in_at
                      ? new Date(k.last_sign_in_at).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Hiç giriş yapmadı"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
