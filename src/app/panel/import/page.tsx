import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { ImportSihirbazi } from "@/components/panel/ImportSihirbazi";
import type { ImportTuru } from "@/lib/import";

export const metadata: Metadata = { title: "Veri İçe Aktarma — ByteNova" };

const GECERLI_TURLER = ["musteri", "urun", "cihaz", "servis"];

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string }>;
}) {
  const { tur } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!yetkiVar(profil?.role, "ayar_yonet")) redirect("/panel");

  const baslangicTuru = (GECERLI_TURLER.includes(tur ?? "") ? tur : "musteri") as ImportTuru;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-white">Veri İçe Aktarma</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Excel (.xlsx) dosyasından müşteri, ürün, cihaz veya açık servis kayıtlarını toplu olarak aktarın.
      </p>
      <div className="mt-6">
        <ImportSihirbazi baslangicTuru={baslangicTuru} />
      </div>
    </div>
  );
}
