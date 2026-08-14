import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { SayimDetay } from "@/components/urun/SayimDetay";

export const metadata: Metadata = { title: "Sayım Detayı — ByteNova" };

export default async function SayimDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: sayim } = await supabase
    .from("stock_counts")
    .select("id, status, started_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (!sayim) notFound();

  const { data: kalemlerHam } = await supabase
    .from("stock_count_items")
    .select("id, product_id, expected_quantity, counted_quantity, products(name, sku, unit)")
    .eq("stock_count_id", id)
    .order("id");

  const kalemler = (kalemlerHam ?? []).map((k) => {
    const urun = k.products as unknown as { name: string; sku: string | null; unit: string } | null;
    return {
      id: k.id,
      product_id: k.product_id,
      urunAdi: urun?.name ?? "Silinmiş ürün",
      sku: urun?.sku ?? null,
      birim: urun?.unit ?? "adet",
      expected_quantity: k.expected_quantity,
      counted_quantity: k.counted_quantity,
    };
  });

  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/panel/stok/sayim"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Sayım
      </Link>

      <div className="mt-3">
        <h1 className="text-xl font-bold text-white">
          Sayım — {new Date(sayim.started_at).toLocaleDateString("tr-TR")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">
          {kalemler.length} ürün · başlangıç anlık görüntüsüyle karşılaştırılıyor
        </p>
      </div>

      <div className="mt-5">
        <SayimDetay
          sayimId={sayim.id}
          durum={sayim.status}
          yetkili={yetkili}
          kalemler={kalemler}
        />
      </div>
    </div>
  );
}
