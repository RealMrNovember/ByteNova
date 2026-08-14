import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DavetKabul } from "@/components/panel/DavetKabul";

export const metadata: Metadata = { title: "Davet — ByteNova" };

export default async function DavetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-2xl p-8 text-center">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold text-white">İşletme Daveti</h1>

        {user ? (
          <DavetKabul token={token} />
        ) : (
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-slate-400">
              Bir işletme sizi ByteNova ekibine davet etti. Daveti kabul etmek
              için önce giriş yapın veya hesap oluşturun; ardından{" "}
              <span className="text-slate-200">bu bağlantıyı yeniden açın</span>.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/kayit"
                className="rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
              >
                Hesap Oluştur
              </Link>
              <Link
                href="/giris"
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-nova-500/50"
              >
                Giriş Yap
              </Link>
            </div>
            <p className="mt-4 text-[11px] text-slate-600">
              İpucu: Davet, gönderildiği e-posta adresiyle açılan hesaba
              tanımlanır.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
