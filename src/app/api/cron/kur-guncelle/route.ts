import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { tcmbKurlariniCek } from "@/lib/doviz";

// Vercel Cron her tetiklemede Authorization: Bearer <CRON_SECRET> gönderir.
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  let kurlar: { code: string; rate: number }[];
  try {
    kurlar = await tcmbKurlariniCek();
  } catch (e) {
    // TCMB hafta sonu/tatilde yayın yapmaz veya geçici olarak erişilemez
    // olabilir — mevcut (son bilinen) kurlar korunur, hata olarak sayılmaz.
    return NextResponse.json({
      ok: false,
      mesaj: "TCMB kuru alınamadı, mevcut kurlar korundu.",
      detay: e instanceof Error ? e.message : String(e),
    });
  }

  if (kurlar.length === 0) {
    return NextResponse.json({
      ok: false,
      mesaj: "TCMB akışında beklenen para birimleri bulunamadı.",
    });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const satirlar = kurlar.map((k) => ({
    currency_code: k.code,
    tenant_id: null,
    rate_to_try: k.rate,
    source: "tcmb" as const,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(satirlar, { onConflict: "currency_code,tenant_id" });

  if (error) {
    return NextResponse.json({ ok: false, hata: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, guncellenen: kurlar });
}
