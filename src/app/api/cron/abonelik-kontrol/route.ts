import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Deneme bitince otomatik "Ödeme Bekliyor"ya düşer; tanımlı ek süre (grace
// period) sonunda otomatik askıya alınır (Bölüm 66). Her geçiş
// tenant_events'e yansır — Vercel Cron her gün tetikler.
const GRACE_PERIOD_GUN = 7;

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

  // 1) Deneme süresi dolan tenant'lar → "Ödeme Bekliyor"
  const { data: denemesiBiten } = await supabase
    .from("tenants")
    .select("id, trial_ends_at")
    .eq("status", "trial")
    .lt("trial_ends_at", simdi.toISOString());

  const denemeIdleri = (denemesiBiten ?? []).map((t) => t.id);
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

  // 2) Grace period'u aşan "Ödeme Bekliyor" tenant'lar → "Askıda"
  const { data: gracePeriodBiten } = await supabase
    .from("tenants")
    .select("id, trial_ends_at")
    .eq("status", "past_due")
    .lt("trial_ends_at", graceSiniri.toISOString());

  const suspendIdleri = (gracePeriodBiten ?? []).map((t) => t.id);
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
    odemeBekliyoraGecen: denemeIdleri.length,
    askiyaAlinan: suspendIdleri.length,
  });
}
