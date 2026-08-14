import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Genel Bakış — ByteNova" };

const SABIT_KARTLAR = [
  { baslik: "Bugünkü Satış", deger: "—", not: "Satış modülüyle bağlanacak", ikon: "🧾" },
  { baslik: "Bugünkü Tahsilat", deger: "—", not: "Kasa modülüyle bağlanacak", ikon: "💰" },
  { baslik: "Açık Servisler", deger: "—", not: "Servis modülüyle bağlanacak", ikon: "🔧" },
  { baslik: "Bugün Teslimler", deger: "—", not: "Servis modülüyle bağlanacak", ikon: "📦" },
  { baslik: "Onay Bekleyen", deger: "—", not: "Servis modülüyle bağlanacak", ikon: "⏳" },
];

export default async function GenelBakisPage() {
  const supabase = await createClient();

  const { data: kritikUrunler } = await supabase
    .from("products")
    .select("id, name, stock_quantity, critical_stock")
    .eq("is_active", true);

  const kritikSayisi = (kritikUrunler ?? []).filter(
    (u) => u.stock_quantity <= u.critical_stock
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Genel Bakış</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            İşletmenizin bugünkü durumu
          </p>
        </div>
      </div>

      {/* Akıllı özet — veri geldikçe canlanacak */}
      <div className="mt-6 rounded-xl border border-nova-500/20 bg-nova-500/5 px-5 py-4 text-sm leading-relaxed text-nova-200/90">
        👋 ByteNova&apos;ya hoş geldiniz. Panel her gün yeni bir modülle
        büyüyor — <span className="font-medium">Servisler ve Müşteriler</span>{" "}
        bu hafta aktifleşiyor. Sol menüden tüm yol haritasını
        keşfedebilirsiniz.
      </div>

      {kritikSayisi > 0 && (
        <Link
          href="/panel/stok?kritik=1"
          className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3.5 text-sm text-red-200 transition hover:border-red-500/50"
        >
          <span className="text-lg">⚠️</span>
          <span>
            <span className="font-semibold">{kritikSayisi} ürün</span> kritik
            stok seviyesinin altında — stoğu kontrol edin →
          </span>
        </Link>
      )}

      {/* Durum kartları */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Link href="/panel/stok?kritik=1" className="glass rounded-xl p-4 transition hover:border-red-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Kritik Stok</span>
            <span className="text-base">⚠️</span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${kritikSayisi > 0 ? "text-red-300" : "text-slate-200"}`}
          >
            {kritikSayisi}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            {kritikSayisi > 0 ? "Ürüne tıklayıp stok girin" : "Tümü yeterli seviyede ✓"}
          </p>
        </Link>
        {SABIT_KARTLAR.map((k) => (
          <div key={k.baslik} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                {k.baslik}
              </span>
              <span className="text-base">{k.ikon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-600">{k.deger}</p>
            <p className="mt-1 text-[11px] text-slate-600">{k.not}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
