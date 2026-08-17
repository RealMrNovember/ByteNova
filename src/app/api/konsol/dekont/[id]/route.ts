import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createKonsolClient } from "@/lib/supabase/konsol-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const konsol = await createKonsolClient();
  const {
    data: { user },
  } = await konsol.auth.getUser();
  if (!user) return new NextResponse("Yetkisiz", { status: 401 });

  const { data: yetkiliMi } = await konsol.rpc("is_platform_admin");
  if (!yetkiliMi) return new NextResponse("Yetkisiz", { status: 403 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: dekont } = await admin
    .from("payment_receipts")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (!dekont) return new NextResponse("Bulunamadı", { status: 404 });

  const { data: imzali, error } = await admin.storage
    .from("servis-belgeleri")
    .createSignedUrl(dekont.storage_path, 300);
  if (error || !imzali) return new NextResponse("Dosya alınamadı", { status: 500 });

  return NextResponse.redirect(imzali.signedUrl);
}
