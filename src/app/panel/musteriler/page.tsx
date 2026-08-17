import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Müşteriler — ByteNova" };

export default async function MusterilerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let sorgu = supabase
    .from("customers")
    .select("id, type, name, phone, email, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (q?.trim()) {
    const aranan = q.trim();
    sorgu = sorgu.or(
      `name.ilike.%${aranan}%,phone.ilike.%${aranan}%,phone2.ilike.%${aranan}%,email.ilike.%${aranan}%`
    );
  }

  const { data: musteriler } = await sorgu;

  const { data: crmPlus } = await supabase
    .from("tenant_addon_subscriptions")
    .select("status")
    .eq("addon_key", "crm_plus")
    .maybeSingle();
  const crmPlusEtkin =
    crmPlus?.status === "active" || crmPlus?.status === "trial";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Müşteriler</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {q
              ? `"${q}" için sonuçlar`
              : "Müşteri kartları ve iletişim geçmişi"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/panel/import?tur=musteri"
            className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            📥 İçe Aktar
          </Link>
          <Link
            href="/panel/musteriler/yeni"
            className="rounded-lg bg-nova-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + Yeni Müşteri
          </Link>
        </div>
      </div>

      {/* Arama */}
      <form method="get" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="🔍 Ad, telefon veya e-posta ile ara…"
          className="w-full max-w-md rounded-lg border border-slate-700 bg-surface-2 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
        />
      </form>

      {/* Liste */}
      {!musteriler?.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">👥</span>
          <h2 className="mt-4 font-semibold text-white">
            {q ? "Sonuç bulunamadı" : "Henüz müşteri yok"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            {q
              ? "Farklı bir arama deneyin veya yeni müşteri oluşturun."
              : "İlk müşterinizi ekleyin — servis ve satış kayıtları müşteri kartına otomatik bağlanacak."}
          </p>
          <Link
            href="/panel/musteriler/yeni"
            className="mt-6 rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
          >
            + İlk müşteriyi oluştur
          </Link>
        </div>
      ) : (
        <div className="glass mt-6 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Telefon
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  E-posta
                </th>
                <th className="px-4 py-3 text-right font-medium">Kayıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {musteriler.map((m) => (
                <tr
                  key={m.id}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/panel/musteriler/${m.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <span className="text-base">
                        {m.type === "corporate" ? "🏢" : "👤"}
                      </span>
                      <span className="font-medium text-slate-200">
                        {m.name}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-2.5 text-slate-400 sm:table-cell">
                    {m.phone ?? "—"}
                  </td>
                  <td className="hidden px-4 py-2.5 text-slate-400 md:table-cell">
                    {m.email ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500">
                    {new Date(m.created_at).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRM Plus üst satış — yalnız aktif değilse gösterilir */}
      {!crmPlusEtkin && (
        <Link
          href="/panel/ayarlar#eklentiler"
          className="glass mt-4 flex items-center gap-3 rounded-xl border border-purple-500/20 px-4 py-3 text-left transition-colors hover:border-purple-500/40"
        >
          <span className="text-lg">👥</span>
          <span className="flex-1 text-xs text-slate-300">
            <span className="font-medium text-purple-300">CRM Plus</span> ile
            müşteri segmentasyonu, toplu kampanya mesajı ve sadakat programı
            açın.
          </span>
          <span className="shrink-0 text-xs font-medium text-purple-300">
            İncele →
          </span>
        </Link>
      )}
    </div>
  );
}
