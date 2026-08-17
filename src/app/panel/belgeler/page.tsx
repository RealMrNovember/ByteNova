import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { paraFormatla } from "@/lib/doviz";

export const metadata: Metadata = { title: "Belgeler — ByteNova" };

const BELGE_ETIKETLERI: Record<string, { ad: string; ikon: string }> = {
  e_fatura: { ad: "e-Fatura", ikon: "🧾" },
  e_arsiv_fatura: { ad: "e-Arşiv Fatura", ikon: "🧾" },
  gider_pusulasi: { ad: "Gider Pusulası", ikon: "📄" },
};

export default async function BelgelerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: belgeler } = await supabase
    .from("e_document_records")
    .select(
      "id, document_type, document_no, description, amount, net_amount, created_at, customers(name), suppliers(name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-white">Belgeler</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Kesilen e-Fatura/e-Arşiv ve düzenlenen gider pusulalarının arşivi. e-Fatura/e-Arşiv
        Satış detayından, gider pusulası Tedarikçi detayından oluşturulur.
      </p>

      <div className="glass mt-6 overflow-hidden rounded-xl">
        {!belgeler?.length ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="text-4xl">🗂️</span>
            <h2 className="mt-4 font-semibold text-white">Henüz belge yok</h2>
            <p className="mt-1.5 max-w-sm text-sm text-slate-400">
              Kurumsal bir satışta e-Fatura kestiğinizde veya vergi mükellefi olmayan bir
              tedarikçiden alım için gider pusulası oluşturduğunuzda burada listelenir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {belgeler.map((b) => {
              const etiket = BELGE_ETIKETLERI[b.document_type] ?? { ad: b.document_type, ikon: "📄" };
              const taraf =
                (b.customers as unknown as { name: string } | null)?.name ??
                (b.suppliers as unknown as { name: string } | null)?.name ??
                "—";
              return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base">{etiket.ikon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">
                      {taraf} <span className="text-slate-500">· {etiket.ad}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{b.document_no}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-200">
                      {paraFormatla(b.net_amount ?? b.amount)}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(b.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  {b.document_type === "gider_pusulasi" && (
                    <Link
                      href={`/api/gider-pusulasi/${b.id}/pdf`}
                      target="_blank"
                      className="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
                    >
                      PDF
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
