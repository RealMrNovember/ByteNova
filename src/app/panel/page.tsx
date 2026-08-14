import type { Metadata } from "next";

export const metadata: Metadata = { title: "Genel Bakış — ByteNova" };

const kartlar = [
  { baslik: "Bugünkü Satış", deger: "—", not: "Satış modülüyle bağlanacak", ikon: "🧾" },
  { baslik: "Bugünkü Tahsilat", deger: "—", not: "Kasa modülüyle bağlanacak", ikon: "💰" },
  { baslik: "Açık Servisler", deger: "—", not: "Servis modülüyle bağlanacak", ikon: "🔧" },
  { baslik: "Bugün Teslimler", deger: "—", not: "Servis modülüyle bağlanacak", ikon: "📦" },
  { baslik: "Kritik Stok", deger: "—", not: "Stok modülüyle bağlanacak", ikon: "⚠️" },
  { baslik: "Onay Bekleyen", deger: "—", not: "Servis modülüyle bağlanacak", ikon: "⏳" },
];

export default function GenelBakisPage() {
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

      {/* Durum kartları */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kartlar.map((k) => (
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
