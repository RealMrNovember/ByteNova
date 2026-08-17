import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";

export const metadata: Metadata = { title: "Tedarikçiler — ByteNova" };

export default async function TedarikcilerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
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

  let sorgu = supabase
    .from("suppliers")
    .select("id, name, currency, phone, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (q?.trim()) {
    sorgu = sorgu.ilike("name", `%${q.trim()}%`);
  }

  const { data: tedarikciler } = await sorgu;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tedarikçiler</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {q ? `"${q}" için sonuçlar` : "Tedarikçi kartları ve alış geçmişi"}
          </p>
        </div>
        {yetkili && (
          <Link
            href="/panel/tedarikciler/yeni"
            className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + Yeni Tedarikçi
          </Link>
        )}
      </div>

      <form method="get" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Tedarikçi adıyla ara…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
      </form>

      {!tedarikciler?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">🤝</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz tedarikçi yok"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            {q
              ? "Farklı bir arama deneyin veya yeni tedarikçi oluşturun."
              : "İlk tedarikçinizi ekleyin — alış faturaları tedarikçi kartına otomatik bağlanacak."}
          </p>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Tedarikçi</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Telefon</th>
                <th className="px-4 py-3 text-right font-medium">Para Birimi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tedarikciler.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-slate-800/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/panel/tedarikciler/${t.id}`} className="flex items-center gap-2.5">
                      <span className="text-base">🤝</span>
                      <span className="font-medium text-slate-200">{t.name}</span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-2.5 text-slate-400 sm:table-cell">
                    {t.phone ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500">
                    {t.currency}
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
