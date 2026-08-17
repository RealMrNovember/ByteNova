import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { teklifDurumu } from "@/lib/teklif";
import { TeklifOnayButonlari } from "@/components/teklif/TeklifOnayButonlari";

export const metadata: Metadata = { title: "Teklif Onayı — ByteNova" };

type Kalem = { name: string; quantity: number; unit_price: number; line_total: number };
type TeklifDetay = {
  id: string;
  quote_no: string;
  status: string;
  currency: string;
  exchange_rate: number | null;
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  note: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  isletme_adi: string;
  musteri_adi: string;
  kalemler: Kalem[];
};

export default async function TeklifOnayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("teklif_detay_al", { p_token: token });
  if (error || !data) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <div className="glass relative w-full max-w-md rounded-2xl p-8 text-center">
          <span className="text-4xl">🔍</span>
          <h1 className="mt-4 text-lg font-bold text-white">Teklif bulunamadı</h1>
          <p className="mt-1.5 text-sm text-slate-400">Bağlantı geçersiz veya süresi dolmuş olabilir.</p>
        </div>
      </main>
    );
  }

  const t = data as TeklifDetay;
  await supabase.rpc("teklif_goruntulendi", { p_token: token });

  const durum = teklifDurumu(t.status);
  const sembol = t.currency === "TRY" ? "₺" : `${t.currency} `;
  const para = (n: number) => `${sembol}${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
  const kararaAcik = t.status === "gonderildi" || t.status === "musteri_inceliyor";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-xl rounded-2xl p-8">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">{t.isletme_adi}</p>
            <h1 className="font-mono text-lg font-bold text-white">{t.quote_no}</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${durum.sinif}`}>{durum.etiket}</span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Sayın {t.musteri_adi} · Geçerlilik: {new Date(t.valid_until).toLocaleDateString("tr-TR")}
        </p>

        <div className="mt-5 divide-y divide-slate-800/60 rounded-lg border border-slate-800">
          {t.kalemler.map((k, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-200">{k.name}</span>
              <span className="shrink-0 text-xs text-slate-500">{k.quantity} adet</span>
              <span className="shrink-0 w-24 text-right font-semibold text-slate-200">{para(k.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          {t.discount_amount > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Genel İskonto</span>
              <span>-{para(t.discount_amount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">Toplam</span>
            <span className="text-xl font-bold text-nova-300">{para(t.total_amount)}</span>
          </div>
        </div>

        {t.note && <p className="mt-3 text-xs text-slate-500">Not: {t.note}</p>}

        {kararaAcik ? (
          <div className="mt-6">
            <TeklifOnayButonlari token={token} />
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-slate-800 bg-surface px-3.5 py-3 text-center text-sm text-slate-300">
            {t.status === "kabul" && "✓ Bu teklifi kabul ettiniz."}
            {t.status === "reddedildi" && "Bu teklifi reddettiniz."}
            {t.status === "suresi_doldu" && "Bu teklifin geçerlilik süresi doldu."}
            {t.status === "taslak" && "Bu teklif henüz gönderilmedi."}
          </p>
        )}
      </div>
    </main>
  );
}
