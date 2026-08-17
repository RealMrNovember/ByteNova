import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { urunFormuIcinDovizVerisi } from "@/lib/doviz";
import { AlisFormu } from "@/components/alis/AlisFormu";

export const metadata: Metadata = { title: "Yeni Alış — ByteNova" };

export default async function YeniAlisPage({
  searchParams,
}: {
  searchParams: Promise<{ tedarikci?: string; urun?: string; miktar?: string }>;
}) {
  const { tedarikci: tedarikciId, urun: urunId, miktar } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const { kurlar } = await urunFormuIcinDovizVerisi(supabase);

  let baslangicTedarikci = null;
  if (tedarikciId) {
    const { data } = await supabase
      .from("suppliers")
      .select("id, name, currency")
      .eq("id", tedarikciId)
      .maybeSingle();
    baslangicTedarikci = data;
  }

  let baslangicKalem = null;
  if (urunId) {
    const { data } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", urunId)
      .maybeSingle();
    if (data) {
      baslangicKalem = { product_id: data.id, name: data.name, quantity: Number(miktar) || 1 };
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold text-white">Yeni Alış</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Tedarikçi faturasını girin — ürünler stoğa işlenir, maliyet ve
        otomatik fiyatlar güncellenir.
      </p>
      <div className="mt-6">
        <AlisFormu
          tenantId={profil?.tenant_id ?? ""}
          kurlar={kurlar}
          baslangicTedarikci={baslangicTedarikci}
          baslangicKalem={baslangicKalem}
        />
      </div>
    </div>
  );
}
