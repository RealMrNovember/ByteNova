import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Bölüm 27: sözleşme bitişi 30 gün önce hatırlatılır. Gerçek bir bildirim kanalı
// (WhatsApp/e-posta ile işletme sahibine gönderim) yerine, mevcut "Yaklaşan"
// gösterge deseniyle (bkz. Çek/Senet) panel içi görünürlük tercih edildi —
// bilinçli kapsam: hatırlatma müşteriye değil işletmeye yöneliktir, bunun için
// ayrı bir bildirim kanalı açmak yerine Genel Bakış'taki panonun kendisi yeterli.
// Bu cron yalnızca süresi geçen sözleşmeleri "süresi_doldu" durumuna düşürür.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const bugun = new Date().toISOString().slice(0, 10);

  const { data: suresiDolanlar } = await supabase
    .from("maintenance_contracts")
    .update({ status: "suresi_doldu" })
    .eq("status", "aktif")
    .lt("end_date", bugun)
    .select("id");

  return NextResponse.json({ ok: true, suresiDolan: suresiDolanlar?.length ?? 0 });
}
