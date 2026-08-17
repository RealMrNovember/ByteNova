import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { teklifDurumu } from "@/lib/teklif";
import { yetkiVar } from "@/lib/yetki";
import { TeklifIslemleri } from "@/components/teklif/TeklifIslemleri";

export const metadata: Metadata = { title: "Teklif Detayı — ByteNova" };

type Kalem = { id: string; name: string; quantity: number; unit_price: number; discount_amount: number; line_total: number };

export default async function TeklifDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!yetkiVar(profil?.role, "teklif_yonet")) redirect("/panel/teklifler");

  const { data: t } = await supabase
    .from("quotes")
    .select("*, customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!t) notFound();

  const { data: kalemler } = await supabase
    .from("quote_items")
    .select("id, name, quantity, unit_price, discount_amount, line_total")
    .eq("quote_id", id)
    .order("id");

  const musteri = t.customers as unknown as { id: string; name: string; phone: string | null } | null;
  const durum = teklifDurumu(t.status);
  const sembol = t.currency === "TRY" ? "₺" : `${t.currency} `;
  const para = (n: number) => `${sembol}${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel/teklifler" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Teklifler
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-mono text-lg font-bold text-white">{t.quote_no}</h1>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durum.sinif}`}>{durum.etiket}</span>
          {t.converted_sale_id && (
            <Link
              href={`/panel/satis/${t.converted_sale_id}`}
              className="rounded-full bg-nova-500/15 px-2.5 py-1 text-[10px] font-semibold text-nova-300 hover:underline"
            >
              🧾 Satışa dönüştürüldü
            </Link>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Düzenlenme: {new Date(t.created_at).toLocaleString("tr-TR")} · Geçerlilik:{" "}
          {new Date(t.valid_until).toLocaleDateString("tr-TR")}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Müşteri</p>
            {musteri ? (
              <Link href={`/panel/musteriler/${musteri.id}`} className="mt-0.5 block text-sm font-medium text-nova-300">
                👤 {musteri.name}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">—</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Belge</p>
            <div className="mt-0.5 flex gap-3">
              <a href={`/api/teklif/${t.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-sm text-nova-300 hover:underline">
                📄 PDF Görüntüle
              </a>
              <a href={`/api/teklif/${t.id}/pdf?indir=1`} className="text-sm text-nova-300 hover:underline">
                ⬇️ İndir
              </a>
            </div>
          </div>
        </div>

        {t.decided_at && (
          <p className="mt-4 rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5 text-xs text-slate-400">
            Karar: {new Date(t.decided_at).toLocaleString("tr-TR")}
            {t.decision_note && ` — ${t.decision_note}`}
          </p>
        )}
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Kalemler</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {(kalemler as Kalem[] | null ?? []).map((k) => (
            <div key={k.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-200">{k.name}</span>
              <span className="shrink-0 text-xs text-slate-500">{k.quantity} adet</span>
              <span className="shrink-0 w-24 text-right font-semibold text-slate-200">{para(k.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ara Toplam</span>
            <span>{para(t.subtotal)}</span>
          </div>
          {t.discount_amount > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Genel İskonto</span>
              <span>-{para(t.discount_amount)}</span>
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-800 pt-1.5">
            <span className="text-sm font-medium text-slate-200">Toplam</span>
            <span className="text-base font-bold text-nova-300">{para(t.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <TeklifIslemleri
          teklifId={t.id}
          publicToken={t.public_token}
          status={t.status}
          yonetebilir={yetkiVar(profil?.role, "teklif_yonet")}
          donusturebilir={yetkiVar(profil?.role, "teklif_donustur")}
        />
      </div>
    </div>
  );
}
