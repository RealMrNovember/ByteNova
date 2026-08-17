import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { durumEtiket, durumSinifi } from "@/lib/servis";

export const metadata: Metadata = { title: "Servis Takip — ByteNova" };

type Gecmis = { durum: string; tarih: string };
type ServisTakip = {
  service_no: string;
  status: string;
  declared_issue: string;
  estimated_cost: number | null;
  final_cost: number | null;
  advance_paid: number | null;
  created_at: string;
  delivered_at: string | null;
  isletme_adi: string;
  isletme_telefon: string | null;
  musteri_adi: string;
  cihaz: { tur: string | null; marka: string | null; model: string | null } | null;
  gecmis: Gecmis[];
};

export default async function ServisTakipPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("servis_takip_bilgisi_al", { p_token: token });
  if (error || !data) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <div className="glass relative w-full max-w-md rounded-2xl p-8 text-center">
          <span className="text-4xl">🔍</span>
          <h1 className="mt-4 text-lg font-bold text-white">Servis kaydı bulunamadı</h1>
          <p className="mt-1.5 text-sm text-slate-400">Bağlantı geçersiz olabilir.</p>
        </div>
      </main>
    );
  }

  const s = data as ServisTakip;
  const para = (n: number) => `₺${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
  const kalanTutar =
    s.final_cost != null ? Math.max(0, s.final_cost - (s.advance_paid ?? 0)) : null;

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
            <p className="text-xs text-slate-500">{s.isletme_adi}</p>
            <h1 className="font-mono text-lg font-bold text-white">{s.service_no}</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${durumSinifi(s.status)}`}>
            {durumEtiket(s.status)}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Sayın {s.musteri_adi} · {new Date(s.created_at).toLocaleDateString("tr-TR")} tarihinde kabul edildi
        </p>

        {s.cihaz && (s.cihaz.marka || s.cihaz.model) && (
          <p className="mt-3 text-sm text-slate-300">
            📱 {[s.cihaz.marka, s.cihaz.model].filter(Boolean).join(" ")}
            {s.cihaz.tur && <span className="text-slate-500"> · {s.cihaz.tur}</span>}
          </p>
        )}

        <div className="mt-3 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Beyan Edilen Arıza</p>
          <p className="mt-0.5 text-sm text-slate-200">{s.declared_issue}</p>
        </div>

        {!!s.gecmis.length && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Süreç</p>
            <div className="mt-2 space-y-2">
              {s.gecmis.map((g, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{durumEtiket(g.durum)}</span>
                  <span className="text-slate-600">
                    {new Date(g.tarih).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(s.estimated_cost != null || s.final_cost != null) && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            {s.final_cost != null ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">Toplam Tutar</span>
                  <span className="text-lg font-bold text-nova-300">{para(s.final_cost)}</span>
                </div>
                {!!s.advance_paid && (
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Alınan Kapora</span>
                    <span>-{para(s.advance_paid)}</span>
                  </div>
                )}
                {kalanTutar != null && kalanTutar > 0 && (
                  <div className="mt-1 flex items-center justify-between text-xs text-amber-300">
                    <span>Teslimde Kalan</span>
                    <span>{para(kalanTutar)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Tahmini Tutar</span>
                <span className="text-sm font-semibold text-slate-200">{para(s.estimated_cost!)}</span>
              </div>
            )}
          </div>
        )}

        {s.status === "teslim_edildi" && s.delivered_at && (
          <p className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 text-center text-sm text-emerald-300">
            ✓ Cihazınız {new Date(s.delivered_at).toLocaleDateString("tr-TR")} tarihinde teslim edildi.
          </p>
        )}

        {s.isletme_telefon && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Sorularınız için: {s.isletme_telefon}
          </p>
        )}
      </div>
    </main>
  );
}
