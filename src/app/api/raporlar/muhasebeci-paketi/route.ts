import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { muhasebeciPaketiOlustur } from "@/lib/excel/muhasebeciPaketiOlustur";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ay = searchParams.get("ay");

  if (!ay || !/^\d{4}-\d{2}$/.test(ay)) {
    return new NextResponse("Geçersiz ay parametresi (YYYY-MM bekleniyor)", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Yetkisiz", { status: 401 });

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!yetkiVar(profil?.role, "rapor_gor") || !profil?.tenant_id) {
    return new NextResponse("Yetkisiz", { status: 403 });
  }

  const { buffer, dosyaAdi } = await muhasebeciPaketiOlustur(supabase, profil.tenant_id, ay);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
    },
  });
}
