import Link from "next/link";
import { notFound } from "next/navigation";
import { createKonsolClient } from "@/lib/supabase/konsol-server";
import { paraFormatla } from "@/lib/doviz";

type Gorunum = {
  son_satislar: { sale_no: string; total_amount: number; created_at: string; musteri_adi: string | null }[];
  son_servisler: { service_no: string; status: string; created_at: string; musteri_adi: string | null }[];
  son_musteriler: { name: string; phone: string | null; created_at: string }[];
};

export default async function DestekGorunumuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createKonsolClient();

  const { data: tenant } = await supabase.from("tenants").select("name").eq("id", id).maybeSingle();
  if (!tenant) notFound();

  const { data, error } = await supabase.rpc("admin_destek_gorunumu", { p_tenant_id: id });
  if (error || !data) notFound();

  const gorunum = data as Gorunum;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/konsol/${id}`}
        className="text-xs text-slate-500 transition-colors hover:text-purple-300"
      >
        ← {tenant.name}
      </Link>

      <div className="glass mt-3 rounded-xl border border-amber-500/25 p-4">
        <p className="text-sm font-semibold text-amber-200">🔎 Salt Okunur Destek Görünümü</p>
        <p className="mt-1 text-xs text-amber-200/80">
          Bu görünüm yalnızca son birkaç kaydı gösterir, hiçbir düzenleme yapılamaz. Her erişim
          işletme sahibinin de görebileceği bir olay kaydı bırakır (şeffaflık ilkesi).
        </p>
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Son Satışlar</h2>
        </div>
        {!gorunum.son_satislar.length ? (
          <p className="px-4 py-6 text-center text-xs text-slate-600">Kayıt yok.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {gorunum.son_satislar.map((s) => (
              <div key={s.sale_no} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="font-mono text-sm text-slate-200">{s.sale_no}</p>
                  <p className="text-[11px] text-slate-500">{s.musteri_adi ?? "Misafir"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-200">{paraFormatla(s.total_amount)}</p>
                  <p className="text-[10px] text-slate-600">{new Date(s.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Son Servisler</h2>
        </div>
        {!gorunum.son_servisler.length ? (
          <p className="px-4 py-6 text-center text-xs text-slate-600">Kayıt yok.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {gorunum.son_servisler.map((s) => (
              <div key={s.service_no} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="font-mono text-sm text-slate-200">{s.service_no}</p>
                  <p className="text-[11px] text-slate-500">{s.musteri_adi ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-300">{s.status}</p>
                  <p className="text-[10px] text-slate-600">{new Date(s.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Son Müşteriler</h2>
        </div>
        {!gorunum.son_musteriler.length ? (
          <p className="px-4 py-6 text-center text-xs text-slate-600">Kayıt yok.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {gorunum.son_musteriler.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-slate-200">{m.name}</p>
                <p className="text-xs text-slate-500">{m.phone ?? "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
