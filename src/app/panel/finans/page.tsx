import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { hesapEtiket, hesapIkon } from "@/lib/kasa";
import { paraFormatla } from "@/lib/doviz";
import { YeniKasaHesabi } from "@/components/finans/YeniKasaHesabi";

export const metadata: Metadata = { title: "Finans — ByteNova" };

export default async function FinansPage() {
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
  const ayarYonetebilir = yetkiVar(profil?.role, "ayar_yonet");

  const { data: hesaplar } = await supabase
    .from("cash_accounts")
    .select("id, name, type, balance, is_active")
    .order("created_at");

  if (!yetkili) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Yetkiniz yok</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Kasa görüntüleme yetkisi sahip, yönetici ve kasa personeli rollerine tanımlıdır.
        </p>
      </div>
    );
  }

  const toplamBakiye = (hesaplar ?? []).reduce((t, h) => t + (h.is_active ? h.balance : 0), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Finans</h1>
          <p className="mt-0.5 text-sm text-slate-400">Kasa hesapları ve tahsilat hareketleri</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/panel/finans/giderler"
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            💸 Giderler
          </Link>
          {ayarYonetebilir && <YeniKasaHesabi tenantId={profil?.tenant_id ?? ""} />}
        </div>
      </div>

      <div className="glass mt-5 rounded-xl p-5 text-center">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Toplam Bakiye</p>
        <p className="mt-1 text-3xl font-bold text-white">{paraFormatla(toplamBakiye)}</p>
      </div>

      {!hesaplar?.length ? (
        <div className="glass mt-4 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <span className="text-4xl">💰</span>
          <h2 className="mt-4 font-semibold text-white">Henüz kasa hesabı yok</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-400">
            Satış tahsilatlarının ve servis kaporalarının işleneceği ilk hesabınızı
            oluşturun (örn. Nakit Kasa).
          </p>
        </div>
      ) : (
        <div className="glass mt-4 divide-y divide-slate-800/60 overflow-hidden rounded-xl">
          {hesaplar.map((h) => (
            <Link
              key={h.id}
              href={`/panel/finans/${h.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-slate-800/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{hesapIkon(h.type)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{h.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {hesapEtiket(h.type)}
                    {!h.is_active && " · Pasif"}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-200">{paraFormatla(h.balance)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
