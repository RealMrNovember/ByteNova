import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { YeniSayimButonu } from "@/components/urun/YeniSayimButonu";

export const metadata: Metadata = { title: "Sayım — ByteNova" };

const DURUM_ETIKET: Record<string, { ad: string; sinif: string }> = {
  taslak: { ad: "Devam Ediyor", sinif: "bg-amber-500/15 text-amber-300" },
  tamamlandi: { ad: "Tamamlandı", sinif: "bg-emerald-500/15 text-emerald-300" },
  iptal: { ad: "İptal Edildi", sinif: "bg-slate-500/15 text-slate-400" },
};

export default async function SayimListesiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const yetkili = yetkiVar(profil?.role, "stok_yonet");

  const { data: sayimlarHam } = await supabase
    .from("stock_counts")
    .select("id, status, started_at, completed_at, stock_count_items(id)")
    .order("started_at", { ascending: false })
    .limit(30);

  const sayimlar = (sayimlarHam ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    started_at: s.started_at,
    completed_at: s.completed_at,
    kalemSayisi: (s.stock_count_items as unknown as { id: string }[]).length,
  }));

  const devamEdenVarMi = sayimlar.some((s) => s.status === "taslak");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/panel/stok"
            className="text-xs text-slate-500 transition-colors hover:text-nova-300"
          >
            ← Stok
          </Link>
          <h1 className="mt-1 text-xl font-bold text-white">Sayım</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Fiziksel sayım → sistem farkı → onay → otomatik düzeltme
          </p>
        </div>
        {yetkili && (
          <YeniSayimButonu devamEdenVarMi={devamEdenVarMi} />
        )}
      </div>

      {!sayimlar.length ? (
        <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">📋</span>
          <h2 className="mt-4 font-semibold text-white">Henüz sayım yapılmadı</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            Yeni bir sayım başlattığınızda mevcut stok anlık görüntülenir;
            fiziksel sayım sonuçlarını girip onayladığınızda farklar otomatik
            düzeltilir.
          </p>
        </div>
      ) : (
        <div className="glass mt-6 divide-y divide-slate-800/60 overflow-hidden rounded-xl">
          {sayimlar.map((s) => {
            const d = DURUM_ETIKET[s.status] ?? DURUM_ETIKET.taslak;
            return (
              <Link
                key={s.id}
                href={`/panel/stok/sayim/${s.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-800/30"
              >
                <div>
                  <p className="text-sm text-slate-200">
                    {new Date(s.started_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {s.kalemSayisi} ürün
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${d.sinif}`}>
                  {d.ad}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
