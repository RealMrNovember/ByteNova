import Link from "next/link";
import { notFound } from "next/navigation";
import { createKonsolClient } from "@/lib/supabase/konsol-server";
import { tenantDurum } from "@/lib/konsol";
import { ROL_ADLARI, type Rol } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import { KasaKapanisiGeriAl } from "@/components/konsol/KasaKapanisiGeriAl";
import { AbonelikYonetimi } from "@/components/konsol/AbonelikYonetimi";

type Detay = {
  tenant: {
    id: string;
    name: string;
    status: string;
    phone: string | null;
    address: string | null;
    trial_ends_at: string | null;
    created_at: string;
    onboarding_completed: boolean;
    plan_id: string | null;
    billing_cycle: "aylik" | "yillik" | null;
  };
  plan: { id: string; key: string; name: string; monthly_price: number; yearly_price: number } | null;
  dekontlar: {
    id: string;
    storage_path: string;
    amount: number | null;
    note: string | null;
    status: "bekliyor" | "onaylandi" | "reddedildi";
    review_note: string | null;
    created_at: string;
    reviewed_at: string | null;
  }[];
  kullanicilar: {
    id: string;
    full_name: string | null;
    role: string;
    email: string;
    created_at: string;
  }[];
  musteri_sayisi: number;
  cihaz_sayisi: number;
  servis_sayisi: number;
  kasa_kapanislari: {
    id: string;
    account_id: string;
    account_name: string;
    closing_date: string;
    expected_balance: number;
    actual_balance: number;
    difference: number;
    explanation: string | null;
    closed_at: string;
    reversed_at: string | null;
    reversal_reason: string | null;
  }[];
  eklentiler: {
    key: string;
    name: string;
    icon: string;
    status: string;
    activated_at: string;
    trial_ends_at: string | null;
    cancelled_at: string | null;
  }[];
  olaylar: {
    id: number;
    event_type: string;
    description: string;
    details: Record<string, unknown> | null;
    admin_email: string | null;
    created_at: string;
  }[];
};

const EKLENTI_DURUM_ETIKET: Record<string, { ad: string; sinif: string }> = {
  trial: { ad: "Deneme", sinif: "bg-amber-500/15 text-amber-300" },
  active: { ad: "Aktif", sinif: "bg-emerald-500/15 text-emerald-300" },
  past_due: { ad: "Ödeme Bekliyor", sinif: "bg-red-500/15 text-red-300" },
  cancelled: { ad: "İptal", sinif: "bg-slate-500/15 text-slate-400" },
};

const OLAY_IKON: Record<string, string> = {
  plan_degisti: "🔄",
  askiya_alindi: "⏸️",
  yeniden_etkinlestirildi: "▶️",
  uzatildi: "⏳",
  dekont_yuklendi: "📤",
  dekont_onaylandi: "✅",
  dekont_reddedildi: "❌",
  kapatildi: "🔒",
};

export default async function KonsolTenantDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createKonsolClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data, error }, { data: platformProfil }, { data: planlar }] = await Promise.all([
    supabase.rpc("admin_tenant_detay", { p_tenant_id: id }),
    user
      ? supabase.from("platform_admins").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("subscription_plans")
      .select("id, key, name, monthly_price, yearly_price")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (error || !data || !(data as Detay).tenant) notFound();

  const {
    tenant,
    plan,
    dekontlar,
    kullanicilar,
    musteri_sayisi,
    cihaz_sayisi,
    servis_sayisi,
    kasa_kapanislari,
    eklentiler,
    olaylar,
  } = data as Detay;
  const durum = tenantDurum(tenant.status);
  const kapanisGeriAlabilir = ["master", "finance"].includes(platformProfil?.role ?? "");

  const ozet = [
    { etiket: "Kullanıcı", deger: kullanicilar.length, ikon: "👥" },
    { etiket: "Müşteri", deger: musteri_sayisi, ikon: "🙋" },
    { etiket: "Cihaz", deger: cihaz_sayisi, ikon: "💻" },
    { etiket: "Servis", deger: servis_sayisi, ikon: "🔧" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/konsol"
        className="text-xs text-slate-500 transition-colors hover:text-purple-300"
      >
        ← Tenant Listesi
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white">🏢 {tenant.name}</h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durum.sinif}`}
              >
                {durum.etiket}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Kayıt: {new Date(tenant.created_at).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Telefon
            </p>
            <p className="mt-0.5 text-sm text-slate-200">
              {tenant.phone ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Adres
            </p>
            <p className="mt-0.5 text-sm text-slate-200">
              {tenant.address ?? "—"}
            </p>
          </div>
        </div>

        {tenant.status === "trial" && tenant.trial_ends_at && (
          <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300">
            ⏳ Deneme süresi bitiş:{" "}
            {new Date(tenant.trial_ends_at).toLocaleDateString("tr-TR")}
          </p>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {ozet.map((o) => (
            <div
              key={o.etiket}
              className="rounded-lg border border-slate-800 bg-surface px-3 py-2.5 text-center"
            >
              <p className="text-lg font-bold text-purple-300">{o.deger}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                {o.etiket}
              </p>
            </div>
          ))}
        </div>
      </div>

      <AbonelikYonetimi
        tenantId={tenant.id}
        status={tenant.status}
        trialEndsAt={tenant.trial_ends_at}
        plan={plan}
        billingCycle={tenant.billing_cycle}
        planlar={planlar ?? []}
        dekontlar={dekontlar}
        platformRol={platformProfil?.role ?? ""}
      />

      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Kullanıcılar</h2>
        <div className="mt-3 divide-y divide-slate-800/60">
          {kullanicilar.map((k) => (
            <div key={k.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-xs font-semibold text-purple-300">
                {(k.full_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">
                  {k.full_name ?? "İsimsiz"}
                </p>
                <p className="truncate text-xs text-slate-500">{k.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-400">
                {ROL_ADLARI[k.role as Rol] ?? k.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Eklentiler</h2>
        {eklentiler.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Bu işletme henüz herhangi bir eklenti paketi kullanmıyor.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-800/60">
            {eklentiler.map((e) => {
              const durum = EKLENTI_DURUM_ETIKET[e.status] ?? EKLENTI_DURUM_ETIKET.active;
              return (
                <div key={e.key} className="flex items-center gap-3 py-2.5">
                  <span className="text-lg">{e.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{e.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Etkinleştirme: {new Date(e.activated_at).toLocaleDateString("tr-TR")}
                      {e.status === "trial" && e.trial_ends_at &&
                        ` · Deneme bitişi: ${new Date(e.trial_ends_at).toLocaleDateString("tr-TR")}`}
                      {e.status === "cancelled" && e.cancelled_at &&
                        ` · İptal: ${new Date(e.cancelled_at).toLocaleDateString("tr-TR")}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${durum.sinif}`}>
                    {durum.ad}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Olay Zaman Çizelgesi</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Bu işletme üzerinde konsoldan yapılan uzatma/askıya alma/plan
          değişikliği gibi işlemler — işletme sahibi de kendi panelinden
          görebilir (şeffaflık).
        </p>
        {olaylar.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">Henüz bir olay kaydı yok.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-800/60">
            {olaylar.map((o) => (
              <div key={o.id} className="flex items-start gap-3 py-2.5">
                <span className="text-base">{OLAY_IKON[o.event_type] ?? "📌"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{o.description}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(o.created_at).toLocaleString("tr-TR")}
                    {o.admin_email && ` · ${o.admin_email}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {kasa_kapanislari.length > 0 && (
        <div className="glass mt-4 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Kasa Kapanışları</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            İşletme kendi kapanışını geri alamaz — yanlışlıkla alınmış bir
            gün sonu burada, gerekçeyle, geri alınabilir.
          </p>
          <div className="mt-3 space-y-2">
            {kasa_kapanislari.map((k) => (
              <div
                key={k.id}
                className={`rounded-lg border px-3.5 py-3 ${
                  k.reversed_at
                    ? "border-slate-800 bg-surface opacity-60"
                    : "border-slate-800 bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">
                      {k.account_name} —{" "}
                      {new Date(`${k.closing_date}T12:00:00`).toLocaleDateString("tr-TR")}
                      {k.reversed_at && (
                        <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          Geri alındı
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Beklenen {paraFormatla(k.expected_balance)} · Fiili{" "}
                      {paraFormatla(k.actual_balance)}
                      {k.explanation && ` — ${k.explanation}`}
                    </p>
                    {k.reversed_at && (
                      <p className="mt-0.5 text-[11px] text-amber-300">
                        Geri alınma gerekçesi: {k.reversal_reason}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      k.difference === 0
                        ? "text-slate-500"
                        : k.difference > 0
                          ? "text-emerald-300"
                          : "text-red-300"
                    }`}
                  >
                    {k.difference > 0 ? "+" : ""}
                    {paraFormatla(k.difference)}
                  </span>
                </div>
                {!k.reversed_at && kapanisGeriAlabilir && (
                  <div className="mt-2">
                    <KasaKapanisiGeriAl closingId={k.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
