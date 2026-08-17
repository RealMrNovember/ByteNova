import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sandboxGonder } from "@/lib/bildirim";

// "beklemede" durumundaki kuyruklanmış bildirimleri işler (bkz. servis
// hazır tetikleyicisi, 0044_bildirimler_whatsapp_sms.sql). Gerçek bir
// sağlayıcıda bu adım asenkron olabilir (webhook ile durum güncellenir);
// sandbox'ta senkron ve her zaman başarılı.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: bekleyenler } = await supabase
    .from("notification_log")
    .select("id, channel, message_body, customer_id, customers(phone)")
    .eq("status", "beklemede")
    .limit(200);

  let gonderilen = 0;
  let basarisiz = 0;

  for (const b of bekleyenler ?? []) {
    const telefon = (b.customers as unknown as { phone: string | null } | null)?.phone;
    if (!telefon) {
      await supabase
        .from("notification_log")
        .update({ status: "basarisiz", error_message: "Müşteri telefonu yok" })
        .eq("id", b.id);
      basarisiz++;
      continue;
    }

    const sonuc = await sandboxGonder({
      kanal: b.channel as "whatsapp" | "sms",
      telefon,
      mesaj: b.message_body,
    });

    if (sonuc.basarili) {
      await supabase
        .from("notification_log")
        .update({ status: "gonderildi", sent_at: new Date().toISOString() })
        .eq("id", b.id);
      gonderilen++;
    } else {
      basarisiz++;
    }
  }

  return NextResponse.json({ ok: true, gonderilen, basarisiz, toplam: bekleyenler?.length ?? 0 });
}
