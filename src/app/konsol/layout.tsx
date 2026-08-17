import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/panel/actions";
import { KonsolSekmeler } from "@/components/konsol/KonsolSekmeler";

export default async function KonsolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: yetkiliMi } = await supabase.rpc("is_platform_admin");
  if (!yetkiliMi) redirect("/panel");

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-purple-500/20 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/konsol" className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-semibold text-white">
              Byte<span className="text-nova-400">Nova</span>
            </span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
              Konsol
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/panel"
              className="text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              ← İşletme paneline dön
            </Link>
            <form action={cikisYap}>
              <button
                type="submit"
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-300"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
        <KonsolSekmeler />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
