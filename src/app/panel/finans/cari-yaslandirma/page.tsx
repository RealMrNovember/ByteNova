import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yaslandirmaHesapla, yaslandirmaToplam, type YaslandirmaBucket } from "@/lib/cari";
import { paraFormatla } from "@/lib/doviz";

export const metadata: Metadata = { title: "Cari Yaşlandırma — ByteNova" };

const HUCRE_SINIFI = (tutar: number, esik90: boolean) => {
  if (tutar <= 0) return "text-slate-700";
  if (esik90) return "text-red-300 font-semibold";
  return "text-slate-300";
};

function YaslandirmaTablosu({
  baslik,
  ikon,
  satirlar,
  linkOn,
  paraFormat,
}: {
  baslik: string;
  ikon: string;
  satirlar: { id: string; ad: string; birim: string; bucket: YaslandirmaBucket }[];
  linkOn: (id: string) => string;
  paraFormat: (tutar: number, birim: string) => string;
}) {
  if (!satirlar.length) {
    return (
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">
          {ikon} {baslik}
        </h2>
        <p className="mt-3 text-center text-xs text-slate-600">Açık bakiye yok.</p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          {ikon} {baslik}
        </h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5 font-medium">İsim</th>
            <th className="px-3 py-2.5 text-right font-medium">0-30g</th>
            <th className="px-3 py-2.5 text-right font-medium">31-60g</th>
            <th className="px-3 py-2.5 text-right font-medium">61-90g</th>
            <th className="px-3 py-2.5 text-right font-medium">90g+</th>
            <th className="px-4 py-2.5 text-right font-medium">Toplam</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {satirlar.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-slate-800/30">
              <td className="px-4 py-2.5">
                <Link href={linkOn(s.id)} className="font-medium text-slate-200 hover:text-nova-300">
                  {s.ad}
                </Link>
              </td>
              <td className={`px-3 py-2.5 text-right ${HUCRE_SINIFI(s.bucket.g0_30, false)}`}>
                {s.bucket.g0_30 > 0 ? paraFormat(s.bucket.g0_30, s.birim) : "—"}
              </td>
              <td className={`px-3 py-2.5 text-right ${HUCRE_SINIFI(s.bucket.g31_60, false)}`}>
                {s.bucket.g31_60 > 0 ? paraFormat(s.bucket.g31_60, s.birim) : "—"}
              </td>
              <td className={`px-3 py-2.5 text-right ${HUCRE_SINIFI(s.bucket.g61_90, false)}`}>
                {s.bucket.g61_90 > 0 ? paraFormat(s.bucket.g61_90, s.birim) : "—"}
              </td>
              <td className={`px-3 py-2.5 text-right ${HUCRE_SINIFI(s.bucket.g90_plus, true)}`}>
                {s.bucket.g90_plus > 0 ? paraFormat(s.bucket.g90_plus, s.birim) : "—"}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold text-slate-100">
                {paraFormat(yaslandirmaToplam(s.bucket), s.birim)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CariYaslandirmaPage() {
  const supabase = await createClient();

  const [{ data: musteriler }, { data: tedarikciler }] = await Promise.all([
    supabase.from("customers").select("id, name, balance").neq("balance", 0).order("balance", { ascending: false }).limit(100),
    supabase.from("suppliers").select("id, name, currency, balance").neq("balance", 0).order("balance", { ascending: false }).limit(100),
  ]);

  const musteriSatirlari = await Promise.all(
    (musteriler ?? []).map(async (m) => {
      const { data: hareketler } = await supabase
        .from("customer_ledger")
        .select("amount, created_at")
        .eq("customer_id", m.id)
        .order("created_at");
      return { id: m.id, ad: m.name, birim: "TRY", bucket: yaslandirmaHesapla(hareketler ?? []) };
    })
  );

  const tedarikciSatirlari = await Promise.all(
    (tedarikciler ?? []).map(async (t) => {
      const { data: hareketler } = await supabase
        .from("supplier_ledger")
        .select("amount, created_at")
        .eq("supplier_id", t.id)
        .order("created_at");
      return { id: t.id, ad: t.name, birim: t.currency, bucket: yaslandirmaHesapla(hareketler ?? []) };
    })
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/panel/finans" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Finans
      </Link>
      <h1 className="mt-1 text-xl font-bold text-white">Cari Yaşlandırma</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Açık bakiyelerin ne kadar süredir beklediğini gösterir — en eski borcun önce kapandığı varsayılır.
      </p>

      <div className="mt-6 space-y-6">
        <YaslandirmaTablosu
          baslik="Müşteri Alacakları"
          ikon="👥"
          satirlar={musteriSatirlari}
          linkOn={(id) => `/panel/musteriler/${id}`}
          paraFormat={(tutar) => paraFormatla(tutar)}
        />
        <YaslandirmaTablosu
          baslik="Tedarikçi Borçları"
          ikon="🤝"
          satirlar={tedarikciSatirlari}
          linkOn={(id) => `/panel/tedarikciler/${id}`}
          paraFormat={(tutar, birim) => `${tutar.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${birim}`}
        />
      </div>
    </div>
  );
}
