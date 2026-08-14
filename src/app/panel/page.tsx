import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panel — ByteNova" };

const menu = [
  { ad: "Genel Bakış", durum: "insa" },
  { ad: "Servisler", durum: "insa" },
  { ad: "Satış", durum: "yakinda" },
  { ad: "Alış", durum: "yakinda" },
  { ad: "PC Toplama", durum: "yakinda" },
  { ad: "Stok", durum: "yakinda" },
  { ad: "Cihazlar", durum: "yakinda" },
  { ad: "Müşteriler", durum: "insa" },
  { ad: "Tedarikçiler", durum: "yakinda" },
  { ad: "Teklifler", durum: "yakinda" },
  { ad: "Sözleşmeler", durum: "yakinda" },
  { ad: "Finans", durum: "yakinda" },
  { ad: "Belgeler", durum: "yakinda" },
  { ad: "Raporlar", durum: "yakinda" },
  { ad: "Bildirimler", durum: "yakinda" },
  { ad: "Ayarlar", durum: "yakinda" },
] as const;

export default function PanelPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-nova-500/30 bg-nova-500/10 px-4 py-1.5 text-xs font-medium text-nova-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nova-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-nova-400" />
          </span>
          Panel inşa halinde — gün gün büyüyor
        </span>
        <h1 className="mt-6 text-3xl font-bold text-white">
          ByteNova İşletme Paneli
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
          Aşağıdaki modüllerin tamamı ürünün yol haritasında. Işıklar her gün
          birer birer yanıyor.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {menu.map((m) => (
            <div
              key={m.ad}
              className="glass flex flex-col items-center gap-2 rounded-xl px-3 py-5"
            >
              <span className="text-sm font-medium text-slate-200">
                {m.ad}
              </span>
              {m.durum === "insa" ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  İnşada
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Yakında
                </span>
              )}
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-10 inline-block text-sm text-nova-300 hover:text-nova-50"
        >
          ← Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
