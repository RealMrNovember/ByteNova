"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DAVET_ROLLERI, ROL_ADLARI, type Rol, yetkiVar } from "@/lib/yetki";

type Kullanici = { id: string; full_name: string | null; role: string };
type Davet = { id: string; email: string; role: string; token: string };

type Props = {
  benimId: string;
  benimRol: string;
  tenantId: string;
  kullanicilar: Kullanici[];
  davetler: Davet[];
};

export function KullaniciYonetimi({
  benimId,
  benimRol,
  tenantId,
  kullanicilar,
  davetler: baslangicDavetler,
}: Props) {
  const router = useRouter();
  const [davetler, setDavetler] = useState(baslangicDavetler);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("technician");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);

  const rolYonetebilir = yetkiVar(benimRol, "kullanici_yonet");
  const davetEdebilir = yetkiVar(benimRol, "davet_gonder");

  async function rolDegistir(kullaniciId: string, yeniRol: string, eskiRol: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: yeniRol })
      .eq("id", kullaniciId);

    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "rol_degisti",
        p_entity: "profile",
        p_entity_id: kullaniciId,
        p_old: { role: eskiRol },
        p_new: { role: yeniRol },
      });
      router.refresh();
    }
  }

  async function davetOlustur(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        tenant_id: tenantId,
        email: email.trim().toLowerCase(),
        role: rol,
        invited_by: user?.id,
      })
      .select("id, email, role, token")
      .single();

    setYukleniyor(false);

    if (error || !data) {
      setHata("Davet oluşturulamadı. Lütfen tekrar deneyin.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "davet_olusturuldu",
      p_entity: "invitation",
      p_entity_id: data.id,
      p_new: { email: data.email, role: data.role },
    });

    setDavetler((d) => [data, ...d]);
    setEmail("");
  }

  async function davetSil(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("invitations").delete().eq("id", id);
    if (!error) {
      setDavetler((d) => d.filter((x) => x.id !== id));
    }
  }

  function davetLinki(token: string) {
    return `${location.origin}/davet/${token}`;
  }

  async function linkKopyala(token: string) {
    await navigator.clipboard.writeText(davetLinki(token));
    setKopyalanan(token);
    setTimeout(() => setKopyalanan(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Kullanıcı listesi */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Kullanıcılar</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          İşletmenizde {kullanicilar.length} kullanıcı var.
        </p>
        <div className="mt-4 divide-y divide-slate-800/60">
          {kullanicilar.map((k) => (
            <div key={k.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nova-500/15 text-xs font-semibold text-nova-300">
                {(k.full_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">
                  {k.full_name ?? "İsimsiz"}
                  {k.id === benimId && (
                    <span className="ml-2 text-[10px] text-slate-500">(siz)</span>
                  )}
                </p>
              </div>
              {rolYonetebilir && k.id !== benimId ? (
                <select
                  value={k.role}
                  onChange={(e) => rolDegistir(k.id, e.target.value, k.role)}
                  className="rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-nova-500"
                >
                  {(["owner", ...DAVET_ROLLERI] as Rol[]).map((r) => (
                    <option key={r} value={r}>
                      {ROL_ADLARI[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-[11px] text-slate-400">
                  {ROL_ADLARI[k.role as Rol] ?? k.role}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Davet */}
      {davetEdebilir && (
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Personel Davet Et</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Davet bağlantısını oluşturup WhatsApp veya e-posta ile paylaşın.
            Bağlantı 7 gün geçerlidir.
          </p>

          <form onSubmit={davetOlustur} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="personel@eposta.com"
              className="flex-1 rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-300 outline-none focus:border-nova-500"
            >
              {DAVET_ROLLERI.map((r) => (
                <option key={r} value={r}>
                  {ROL_ADLARI[r]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={yukleniyor}
              className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
            >
              {yukleniyor ? "…" : "Davet Oluştur"}
            </button>
          </form>

          {hata && (
            <p className="mt-2 text-xs text-red-300">{hata}</p>
          )}

          {davetler.length > 0 && (
            <div className="mt-4 space-y-2">
              {davetler.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-surface px-3 py-2.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-300">{d.email}</p>
                    <p className="text-[10px] text-slate-500">
                      {ROL_ADLARI[d.role as Rol] ?? d.role} • bekliyor
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => linkKopyala(d.token)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-nova-500/50"
                    >
                      {kopyalanan === d.token ? "✓ Kopyalandı" : "🔗 Linki Kopyala"}
                    </button>
                    <button
                      onClick={() => davetSil(d.id)}
                      className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] text-red-300/80 transition hover:border-red-500/40"
                      title="Daveti iptal et"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
