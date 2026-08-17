import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Bölüm 12.7: "hazır" durumunda tanımlı süre (tenant başına ayarlanabilir,
// varsayılan 15 gün) geçen cihazlar otomatik "Teslim Alınmadı (Bekliyor)"
// durumuna düşer. Gerçek SMS/arama/ihtar zincirleri (gün 15/30/60) ayrı bir
// bildirim sağlayıcısı (WhatsApp/SMS eklentisi, Sprint 9-12) gerektirir —
// bugün yalnız durum geçişi ve panel içi görünürlük (servis listesi +
// dashboard sayacı) kapsanıyor; bilinçli kapsam dışı.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tenants } = await supabase.from("tenants").select("id, hazir_bekleme_gun");

  let toplamDusurulen = 0;

  for (const t of tenants ?? []) {
    const sinir = new Date(Date.now() - t.hazir_bekleme_gun * 24 * 60 * 60 * 1000).toISOString();

    const { data: hazirServisler } = await supabase
      .from("service_orders")
      .select("id")
      .eq("tenant_id", t.id)
      .eq("status", "hazir");

    for (const s of hazirServisler ?? []) {
      const { data: sonHazirGecisi } = await supabase
        .from("service_status_history")
        .select("created_at")
        .eq("service_order_id", s.id)
        .eq("to_status", "hazir")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sonHazirGecisi || sonHazirGecisi.created_at >= sinir) continue;

      const { error } = await supabase
        .from("service_orders")
        .update({ status: "teslim_alinmadi" })
        .eq("id", s.id);
      if (error) continue;

      await supabase.from("service_notes").insert({
        tenant_id: t.id,
        service_order_id: s.id,
        user_id: null,
        content: `⏰ Otomatik: cihaz ${t.hazir_bekleme_gun} gündür teslim alınmadığı için "Teslim Alınmadı (Bekliyor)" durumuna alındı.`,
      });

      toplamDusurulen += 1;
    }
  }

  return NextResponse.json({ ok: true, teslimAlinmadiyaDusurulen: toplamDusurulen });
}
