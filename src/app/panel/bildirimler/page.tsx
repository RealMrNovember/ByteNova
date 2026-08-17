import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BildirimGonder } from "@/components/bildirim/BildirimGonder";
import {
  DURUM_ETIKETLERI,
  KANAL_ADLARI,
  KANAL_IKONLARI,
  sablonBul,
  type BildirimKanal,
} from "@/lib/bildirim";

export const metadata: Metadata = { title: "Bildirimler — ByteNova" };

export default async function BildirimlerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const tenantId = profil?.tenant_id ?? "";

  const { data: gecmis } = await supabase
    .from("notification_log")
    .select("id, channel, template_key, status, message_body, created_at, customers(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-white">Bildirimler</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        WhatsApp/SMS gönderimi ve geçmişi — servis hazır olduğunda müşteriye otomatik bildirim
        kuyruğa eklenir.
      </p>

      <div className="mt-6">
        <BildirimGonder tenantId={tenantId} />
      </div>

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Geçmiş</h2>
        </div>
        {!gecmis?.length ? (
          <p className="px-4 py-8 text-center text-xs text-slate-600">
            Henüz gönderilen bir bildirim yok.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {gecmis.map((b) => {
              const musteri = b.customers as unknown as { name: string } | null;
              const sablon = sablonBul(b.template_key);
              return (
                <div key={b.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 text-base">
                    {KANAL_IKONLARI[b.channel as BildirimKanal]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200">
                      {musteri?.name ?? "—"}{" "}
                      <span className="text-slate-500">
                        · {KANAL_ADLARI[b.channel as BildirimKanal]} · {sablon?.ad ?? b.template_key}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{b.message_body}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        b.status === "gonderildi"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : b.status === "basarisiz"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {DURUM_ETIKETLERI[b.status] ?? b.status}
                    </span>
                    <p className="mt-1 text-[10px] text-slate-600">
                      {new Date(b.created_at).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
