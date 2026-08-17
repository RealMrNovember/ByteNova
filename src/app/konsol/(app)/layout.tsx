import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createKonsolClient } from "@/lib/supabase/konsol-server";
import { konsolCikisYap } from "../actions";
import { KonsolSekmeler } from "@/components/konsol/KonsolSekmeler";

export default async function KonsolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createKonsolClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/konsol/giris");

  const { data: yetkiliMi } = await supabase.rpc("is_platform_admin");
  if (!yetkiliMi) {
    // Bu çerez alanında oturum var ama hesap platform admin değil (yetki
    // sonradan kaldırılmış olabilir) — döngüye girmemek için oturumu
    // burada kapatıp girişe gönderiyoruz.
    await supabase.auth.signOut();
    redirect("/konsol/giris?hata=yetkisiz");
  }

  // MFA zorunlu: doğrulanmış bir TOTP faktörü yoksa kuruluma, varsa ama bu
  // oturumda henüz ikinci adım tamamlanmadıysa doğrulamaya yönlendir.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.currentLevel !== "aal2") {
    redirect(aal.nextLevel === "aal2" ? "/konsol/mfa-dogrula" : "/konsol/mfa-kur");
  }

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("allowed_ips")
    .eq("id", user.id)
    .single();

  if (admin?.allowed_ips && admin.allowed_ips.length > 0) {
    const basliklar = await headers();
    const istekIp =
      basliklar.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      basliklar.get("x-real-ip") ??
      "";
    if (!admin.allowed_ips.includes(istekIp)) {
      await supabase.auth.signOut();
      redirect("/konsol/giris?hata=ip_kisitli");
    }
  }

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
            <form action={konsolCikisYap}>
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
