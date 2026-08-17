import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import { sozlesmeDurumu, ziyaretDurumu, slaMetni } from "@/lib/sozlesme";
import { SozlesmeIslemleri } from "@/components/sozlesme/SozlesmeIslemleri";
import { ZiyaretPaneli } from "@/components/sozlesme/ZiyaretPaneli";

export const metadata: Metadata = { title: "Sözleşme Detayı — ByteNova" };

export default async function SozlesmeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const { data: s } = await supabase
    .from("maintenance_contracts")
    .select("*, customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!s) notFound();

  const { data: ziyaretler } = await supabase
    .from("contract_visits")
    .select("id, scheduled_date, status, technician_id, visit_report, kapsam_disi_is, completed_at")
    .eq("contract_id", id)
    .order("scheduled_date");

  const { data: teknisyenler } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["owner", "manager", "technician"])
    .order("full_name");

  const musteri = s.customers as unknown as { id: string; name: string; phone: string | null } | null;
  const durumBilgi = sozlesmeDurumu(s.status);
  const sozlesmeYetkili = yetkiVar(profil?.role, "teklif_yonet");
  const ziyaretYetkili = yetkiVar(profil?.role, "servis_yonet");
  const adSozlugu = new Map((teknisyenler ?? []).map((t) => [t.id, t.full_name ?? "İsimsiz"]));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel/sozlesmeler" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Sözleşmeler
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-slate-500">{s.contract_no}</p>
            <h1 className="text-lg font-bold text-white">{s.name}</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${durumBilgi.sinif}`}>
            {durumBilgi.etiket}
          </span>
        </div>

        {musteri && (
          <Link href={`/panel/musteriler/${musteri.id}`} className="mt-1 block text-sm text-nova-300 hover:text-nova-100">
            👤 {musteri.name}
          </Link>
        )}

        {s.scope_description && <p className="mt-3 text-sm text-slate-300">{s.scope_description}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">
              {s.currency === "TRY" ? paraFormatla(s.monthly_fee) : `${s.currency} ${s.monthly_fee.toLocaleString("tr-TR")}`}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Aylık Bedel</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">{s.device_count ?? "—"}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Cihaz</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">{slaMetni(s.sla_hours)}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">SLA</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-slate-200">{s.period_months} ay</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Periyot</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {new Date(s.start_date).toLocaleDateString("tr-TR")} — {new Date(s.end_date).toLocaleDateString("tr-TR")}
          {s.billing_day && ` · Faturalama günü: ayın ${s.billing_day}.`}
        </p>
      </div>

      {sozlesmeYetkili && s.status === "aktif" && <SozlesmeIslemleri contractId={s.id} />}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Ziyaret Takvimi</h2>
        </div>
        {!ziyaretler?.length ? (
          <p className="px-4 py-10 text-center text-sm text-slate-600">Ziyaret bulunamadı.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {ziyaretler.map((z) => {
              const zd = ziyaretDurumu(z.status);
              return (
                <div key={z.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-200">{new Date(z.scheduled_date).toLocaleDateString("tr-TR")}</p>
                      <p className="text-[11px] text-slate-500">
                        {z.technician_id ? adSozlugu.get(z.technician_id) ?? "—" : "Teknisyen atanmadı"}
                        {z.kapsam_disi_is && " · Kapsam Dışı İş"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${zd.sinif}`}>{zd.etiket}</span>
                  </div>
                  {z.visit_report && (
                    <p className="mt-1.5 rounded-lg border border-slate-800 bg-surface px-3 py-2 text-xs text-slate-400">
                      {z.visit_report}
                    </p>
                  )}
                  {ziyaretYetkili && z.status === "planlandi" && (
                    <ZiyaretPaneli visitId={z.id} teknisyenler={teknisyenler ?? []} atanmisTeknisyen={z.technician_id} />
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
