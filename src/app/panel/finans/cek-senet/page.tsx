import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import {
  DURUM_ETIKETLERI,
  DURUM_SINIFLARI,
  tipEtiket,
  vadeDurumu,
  type CekDurum,
  type CekYon,
} from "@/lib/cekSenet";
import { CekSenetEkle } from "@/components/finans/CekSenetEkle";
import { CekSenetIslemi } from "@/components/finans/CekSenetIslemi";

export const metadata: Metadata = { title: "Çek/Senet Portföyü — ByteNova" };

export default async function CekSenetPage() {
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
      </div>
    );
  }

  const [{ data: cekler }, { data: kasaHesaplari }] = await Promise.all([
    supabase
      .from("cheques")
      .select("id, instrument_type, direction, party_name, due_date, amount, status")
      .order("due_date", { ascending: true }),
    supabase.from("cash_accounts").select("id, name, type").eq("is_active", true).order("created_at"),
  ]);

  const acikOlanlar = (cekler ?? []).filter((c) => !["tahsil_edildi", "ciro_edildi", "odendi"].includes(c.status));
  const kapananlar = (cekler ?? []).filter((c) => ["tahsil_edildi", "ciro_edildi", "odendi"].includes(c.status));

  const yaklasanToplam = acikOlanlar
    .filter((c) => vadeDurumu(c.due_date) !== "normal" && c.direction === "alinan")
    .reduce((t, c) => t + c.amount, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Çek/Senet Portföyü</h1>
          <p className="mt-0.5 text-sm text-slate-400">Alınan ve verilen çek/senetlerin vade takibi</p>
        </div>
        <CekSenetEkle tenantId={profil?.tenant_id ?? ""} />
      </div>

      {yaklasanToplam > 0 && (
        <div className="glass mt-5 rounded-xl border border-amber-500/25 p-4 text-sm text-amber-200">
          ⚠️ Önümüzdeki 7 gün içinde (veya vadesi geçmiş) tahsil edilecek{" "}
          <strong>{paraFormatla(yaklasanToplam)}</strong> tutarında alınan çek/senet var.
        </div>
      )}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">
            Açık {acikOlanlar.length > 0 && `(${acikOlanlar.length})`}
          </h2>
        </div>
        {!acikOlanlar.length ? (
          <p className="px-4 py-10 text-center text-sm text-slate-600">Açık çek/senet yok.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {acikOlanlar.map((c) => {
              const vd = vadeDurumu(c.due_date);
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200">
                        {c.party_name}{" "}
                        <span className="text-slate-500">
                          · {tipEtiket(c.instrument_type)} · {c.direction === "alinan" ? "Alınan" : "Verilen"}
                        </span>
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          vd === "gecmis" ? "text-red-400" : vd === "yakin" ? "text-amber-400" : "text-slate-500"
                        }`}
                      >
                        Vade: {new Date(`${c.due_date}T12:00:00`).toLocaleDateString("tr-TR")}
                        {vd === "gecmis" && " · Vadesi geçti"}
                        {vd === "yakin" && " · Yaklaşıyor"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-200">{paraFormatla(c.amount)}</p>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${DURUM_SINIFLARI[c.status as CekDurum]}`}
                      >
                        {DURUM_ETIKETLERI[c.status as CekDurum]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <CekSenetIslemi
                      tenantId={profil?.tenant_id ?? ""}
                      cekId={c.id}
                      yon={c.direction as CekYon}
                      mevcutDurum={c.status as CekDurum}
                      kasaHesaplari={kasaHesaplari ?? []}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!!kapananlar.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Kapanmış ({kapananlar.length})</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {kapananlar.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-300">
                    {c.party_name} <span className="text-slate-500">· {tipEtiket(c.instrument_type)}</span>
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-sm text-slate-400">{paraFormatla(c.amount)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DURUM_SINIFLARI[c.status as CekDurum]}`}
                  >
                    {DURUM_ETIKETLERI[c.status as CekDurum]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-600">
        <Link href="/panel/finans" className="hover:text-nova-300">
          ← Finans
        </Link>
      </p>
    </div>
  );
}
