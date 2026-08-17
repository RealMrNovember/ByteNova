import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { barkodSorgula } from "@/lib/barkod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kod: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ bulundu: false }, { status: 401 });
  }

  const { kod } = await params;
  const sonuc = await barkodSorgula(kod);
  return NextResponse.json(sonuc);
}
