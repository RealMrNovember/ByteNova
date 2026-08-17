import { NextResponse } from "next/server";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { billingProvider } from "@/lib/billing";

// Deneme bitince otomatik "Ödeme Bekliyor"ya düşer; tanımlı ek süre (grace
// period) sonunda otomatik askıya alınır (Bölüm 66). Her geçiş
// tenant_events'e yansır — Vercel Cron her gün tetikler.
//
// Otomatik tahsilat (Sprint 9-12): bir tenant'ın kayıtlı bir ödeme
// yöntemi varsa, "Ödeme Bekliyor"ya düşürmeden/askıya almadan ÖNCE
// sandbox BillingProvider ile bir tahsilat denenir — başarılıysa
// abonelik otomatik uzar ve tenant hiç kesintiye uğramaz (dunning'in
// "önce otomatik dene" adımı). Kayıtlı yöntem yoksa veya deneme
// başarısız olursa mevcut manuel dekont akışına (bu route'un asıl işi)
// aynen düşer.
const GRACE_PERIOD_GUN = 7;

type Plan = { monthly_price: number; yearly_price: number };
type TenantAdayi = { id: string; plan_id: string | null; billing_cycle: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function otomatikTahsilatDene(
  supabase: SupabaseClient<any>,
  adaylar: TenantAdayi[]
): Promise<Set<string>> {
  const basarililar = new Set<string>();
  if (adaylar.length === 0) return basarililar;

  const { data: odemeYontemleri } = await supabase
    .from("tenant_payment_methods")
    .select("tenant_id, provider_token, last4")
    .in("tenant_id", adaylar.map((a) => a.id));
  const yontemMap = new Map((odemeYontemleri ?? []).map((y) => [y.tenant_id, y]));

  const planIdleri = [...new Set(adaylar.map((a) => a.plan_id).filter(Boolean))] as string[];
  const { data: planlar } = planIdleri.length
    ? await supabase.from("subscription_plans").select("id, monthly_price, yearly_price").in("id", planIdleri)
    : { data: [] as (Plan & { id: string })[] };
  const planMap = new Map((planlar ?? []).map((p) => [p.id, p]));

  for (const tenant of adaylar) {
    const yontem = yontemMap.get(tenant.id);
    if (!yontem) continue;

    const plan = tenant.plan_id ? planMap.get(tenant.plan_id) : null;
    const tutar = plan ? (tenant.billing_cycle === "yillik" ? plan.yearly_price : plan.monthly_price) : 0;
    if (!tutar) continue;

    const sonuc = await billingProvider.tahsilatYap({ tutar, token: yontem.provider_token });

    if (sonuc.basarili) {
      await supabase.rpc("abonelik_tahsilat_kaydet", {
        p_tenant_id: tenant.id,
        p_basarili: true,
        p_tutar: tutar,
        p_provider_referans: sonuc.providerReferans,
      });
      basarililar.add(tenant.id);
    } else {
      await supabase.rpc("abonelik_tahsilat_kaydet", {
        p_tenant_id: tenant.id,
        p_basarili: false,
        p_tutar: tutar,
        p_hata_mesaji: sonuc.hata,
      });
    }
  }

  return basarililar;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const simdi = new Date();
  const graceSiniri = new Date(simdi.getTime() - GRACE_PERIOD_GUN * 24 * 60 * 60 * 1000);

  // 1) Deneme süresi dolan tenant'lar — önce otomatik tahsilat denenir
  const { data: denemesiBiten } = await supabase
    .from("tenants")
    .select("id, trial_ends_at, plan_id, billing_cycle")
    .eq("status", "trial")
    .lt("trial_ends_at", simdi.toISOString());

  const denemeAdaylari = denemesiBiten ?? [];
  const otomatikUzananlar1 = await otomatikTahsilatDene(supabase, denemeAdaylari);
  const denemeIdleri = denemeAdaylari.map((t) => t.id).filter((id) => !otomatikUzananlar1.has(id));

  if (denemeIdleri.length > 0) {
    await supabase.from("tenants").update({ status: "past_due" }).in("id", denemeIdleri);
    await supabase.from("tenant_events").insert(
      denemeIdleri.map((id) => ({
        tenant_id: id,
        admin_id: null,
        event_type: "deneme_bitti",
        description: "Deneme süresi doldu, ödeme bekleniyor.",
      }))
    );
  }

  // 2) Grace period'u aşan "Ödeme Bekliyor" tenant'lar — son bir otomatik deneme
  const { data: gracePeriodBiten } = await supabase
    .from("tenants")
    .select("id, trial_ends_at, plan_id, billing_cycle")
    .eq("status", "past_due")
    .lt("trial_ends_at", graceSiniri.toISOString());

  const suspendAdaylari = gracePeriodBiten ?? [];
  const otomatikUzananlar2 = await otomatikTahsilatDene(supabase, suspendAdaylari);
  const suspendIdleri = suspendAdaylari.map((t) => t.id).filter((id) => !otomatikUzananlar2.has(id));

  if (suspendIdleri.length > 0) {
    await supabase.from("tenants").update({ status: "suspended" }).in("id", suspendIdleri);
    await supabase.from("tenant_events").insert(
      suspendIdleri.map((id) => ({
        tenant_id: id,
        admin_id: null,
        event_type: "askiya_alindi",
        description: `Otomatik: ${GRACE_PERIOD_GUN} günlük ek süre boyunca ödeme alınamadığı için askıya alındı.`,
      }))
    );
  }

  return NextResponse.json({
    ok: true,
    otomatikTahsilatBasarili: otomatikUzananlar1.size + otomatikUzananlar2.size,
    odemeBekliyoraGecen: denemeIdleri.length,
    askiyaAlinan: suspendIdleri.length,
  });
}
