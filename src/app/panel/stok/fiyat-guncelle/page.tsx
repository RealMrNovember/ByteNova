import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { etkinKurlar, fiyatHesapla } from "@/lib/doviz";
import { yetkiVar } from "@/lib/yetki";
import { TopluFiyatGuncelle } from "@/components/urun/TopluFiyatGuncelle";

export const metadata: Metadata = { title: "Fiyat Güncelleme — ByteNova" };

export default async function FiyatGuncellePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  const [{ data: urunlerHam }, kurHaritasi] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, sku, purchase_price, purchase_currency, price_margin, sale_price")
      .eq("is_active", true)
      .eq("auto_price", true)
      .neq("purchase_currency", "TRY")
      .order("name"),
    etkinKurlar(supabase),
  ]);

  const urunler = (urunlerHam ?? [])
    .map((u) => {
      const kur = kurHaritasi.get(u.purchase_currency)?.rate_to_try ?? null;
      const onerilenFiyat =
        kur && u.purchase_price != null
          ? fiyatHesapla(u.purchase_price, kur, u.price_margin ?? 0)
          : null;
      return {
        id: u.id,
        name: u.name,
        sku: u.sku,
        purchase_price: u.purchase_price,
        purchase_currency: u.purchase_currency,
        kur,
        mevcutFiyat: u.sale_price,
        onerilenFiyat,
      };
    })
    .filter((u) => u.onerilenFiyat != null);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/panel/stok"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Stok
      </Link>

      <div className="mt-3">
        <h1 className="text-xl font-bold text-white">Kur Bazlı Fiyat Güncelleme</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          Dövizli alış maliyetiyle otomatik fiyatlanan ürünler, güncel kura göre
          yeniden hesaplanır. Değişenleri seçip toplu güncelleyin.
        </p>
      </div>

      <div className="mt-5">
        <TopluFiyatGuncelle urunler={urunler} yetkili={yetkili} />
      </div>
    </div>
  );
}
