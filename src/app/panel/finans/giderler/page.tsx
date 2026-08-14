import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { giderKategoriEtiket, giderKategoriIkon } from "@/lib/gider";
import { paraFormatla } from "@/lib/doviz";
import { GiderEkle } from "@/components/finans/GiderEkle";

export const metadata: Metadata = { title: "Giderler — ByteNova" };

export default async function GiderlerPage() {
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

  const yetkili = yetkiVar(profil?.role, "kasa_yonet");

  if (!yetkili) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Yetkiniz yok</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Gider görüntüleme yetkisi sahip, yönetici ve kasa personeli rollerine tanımlıdır.
        </p>
      </div>
    );
  }

  const [{ data: giderler }, { data: kasaHesaplari }, { data: tekrarlayanlarHam }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, category, description, amount, account_id, receipt_path, created_at, cash_accounts(name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("cash_accounts").select("id, name, type").eq("is_active", true).order("created_at"),
    supabase
      .from("expenses")
      .select("category, description, amount, account_id, created_at")
      .eq("is_recurring", true)
      .order("created_at", { ascending: false }),
  ]);

  // Fiş görsel URL'leri (imzalı, 1 saat geçerli)
  const gosterilecekler = await Promise.all(
    (giderler ?? []).map(async (g) => {
      let fisUrl: string | null = null;
      if (g.receipt_path) {
        const { data } = await supabase.storage
          .from("servis-belgeleri")
          .createSignedUrl(g.receipt_path, 3600);
        fisUrl = data?.signedUrl ?? null;
      }
      return { ...g, fisUrl };
    })
  );

  // Tekrarlayan gider şablonları: her (kategori, açıklama) çiftinin en son kaydı,
  // bu ay içinde tekrar girilmemişse hatırlatma listesine düşer
  type TekrarKaydi = { category: string; description: string | null; amount: number; account_id: string; created_at: string };
  const suAy = new Date();
  const suAyBaslangic = new Date(suAy.getFullYear(), suAy.getMonth(), 1);
  const gruplar = new Map<string, TekrarKaydi>();
  for (const g of (tekrarlayanlarHam ?? []) as TekrarKaydi[]) {
    const anahtar = `${g.category}::${g.description ?? ""}`;
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, g);
  }
  const hatirlaticilar = Array.from(gruplar.values()).filter(
    (g) => new Date(g.created_at) < suAyBaslangic
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/panel/finans" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
            ← Finans
          </Link>
          <h1 className="mt-1 text-xl font-bold text-white">Giderler</h1>
        </div>
        <GiderEkle tenantId={profil?.tenant_id ?? ""} kasaHesaplari={kasaHesaplari ?? []} />
      </div>

      {hatirlaticilar.length > 0 && (
        <div className="glass mt-5 rounded-xl border border-amber-500/25 p-4">
          <p className="text-xs font-medium text-amber-300">
            ⏰ Bu ay henüz girilmemiş tekrarlayan giderler
          </p>
          <div className="mt-2 space-y-1.5">
            {hatirlaticilar.map((g) => (
              <div
                key={`${g.category}-${g.description}`}
                className="flex items-center justify-between text-xs text-slate-400"
              >
                <span>
                  {giderKategoriIkon(g.category)} {giderKategoriEtiket(g.category)}
                  {g.description ? ` — ${g.description}` : ""}
                </span>
                <span>{paraFormatla(g.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!gosterilecekler.length ? (
        <div className="glass mt-5 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">💸</span>
          <h2 className="mt-4 font-semibold text-white">Henüz gider kaydı yok</h2>
        </div>
      ) : (
        <div className="glass mt-5 divide-y divide-slate-800/60 overflow-hidden rounded-xl">
          {gosterilecekler.map((g) => {
            const hesap = g.cash_accounts as unknown as { name: string } | null;
            return (
              <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-base">{giderKategoriIkon(g.category)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">
                    {giderKategoriEtiket(g.category)}
                    {g.description && <span className="text-slate-500"> — {g.description}</span>}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {hesap?.name ?? "—"} ·{" "}
                    {new Date(g.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {g.fisUrl && (
                  <a
                    href={g.fisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-nova-300 hover:text-nova-100"
                  >
                    📎 Fiş
                  </a>
                )}
                <span className="shrink-0 text-sm font-semibold text-red-300">-{paraFormatla(g.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
