import { NextResponse } from "next/server";
import { demoTenantiSifirlaVeDoldur } from "@/lib/demo";

// Showroom canlı demo hesabını her gece baştaki örnek veriyle sıfırlar.
// Aynı uç nokta ilk kurulumda da (tenant henüz yoksa) demo tenant'ı
// oluşturmak için elle tetiklenebilir — idempotent.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  const { tenantId } = await demoTenantiSifirlaVeDoldur();
  return NextResponse.json({ ok: true, tenantId });
}
