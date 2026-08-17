import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { musteriEkstrePdfOlustur } from "@/lib/pdf/olustur";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const indir = searchParams.get("indir") === "1";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Yetkisiz", { status: 401 });

  const sonuc = await musteriEkstrePdfOlustur(supabase, id);
  if (!sonuc) return new NextResponse("Bulunamadı", { status: 404 });

  return new NextResponse(new Uint8Array(sonuc.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${indir ? "attachment" : "inline"}; filename="${sonuc.dosyaAdi}"`,
    },
  });
}
