"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  platformDavetiOlustur,
  platformDavetiniIptal,
  platformRoluDegistir,
  platformAdminiKaldir,
} from "@/app/konsol/(app)/adminler/actions";

type Admin = { id: string; email: string; role: string; granted_at: string };
type Davet = { id: string; email: string; role: string; expires_at: string; created_at: string };

const ROL_ADLARI: Record<string, string> = {
  master: "Master Admin",
  manager: "Platform Yöneticisi",
  finance: "Finans",
  support: "Destek",
  analyst: "Analist",
};
const ROLLER = Object.keys(ROL_ADLARI);

type Props = {
  adminler: Admin[];
  davetler: Davet[];
  benimId: string;
  benimRolMasterMi: boolean;
};

export function AdminYonetimi({ adminler, davetler, benimId, benimRolMasterMi }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("support");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islenenId, setIslenenId] = useState<string | null>(null);

  async function davetGonder() {
    setGonderiliyor(true);
    setHata(null);
    const sonuc = await platformDavetiOlustur(email, rol);
    setGonderiliyor(false);
    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function davetIptal(id: string) {
    setIslenenId(id);
    await platformDavetiniIptal(id);
    setIslenenId(null);
    router.refresh();
  }

  async function rolDegistir(adminId: string, yeniRol: string) {
    setIslenenId(adminId);
    setHata(null);
    const sonuc = await platformRoluDegistir(adminId, yeniRol);
    setIslenenId(null);
    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    router.refresh();
  }

  async function kaldir(adminId: string) {
    setIslenenId(adminId);
    setHata(null);
    const sonuc = await platformAdminiKaldir(adminId);
    setIslenenId(null);
    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Platform Adminleri</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        {benimRolMasterMi
          ? "Admin ekleme, rol değiştirme ve kaldırma yalnız Master Admin rolüne açıktır."
          : "Bu liste salt-okunur — admin yönetimi yalnız Master Admin rolüne açıktır."}
      </p>

      {benimRolMasterMi && (
        <div className="glass mt-6 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Yeni Admin Davet Et</h2>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cicibyte.com"
              className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-500"
            />
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-purple-500"
            >
              {ROLLER.map((r) => (
                <option key={r} value={r}>
                  {ROL_ADLARI[r]}
                </option>
              ))}
            </select>
            <button
              onClick={davetGonder}
              disabled={gonderiliyor || !email.trim()}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              {gonderiliyor ? "…" : "Davet Gönder"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Davetli, bu e-postayla mevcut bir hesabı varsa doğrudan, yoksa önce ByteNova&apos;ya
            kayıt olup e-postasını doğruladıktan sonra{" "}
            <span className="font-mono">/konsol/giris</span>&apos;te giriş yaptığında davet
            otomatik kabul edilir.
          </p>
          {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
        </div>
      )}

      {davetler.length > 0 && (
        <div className="glass mt-4 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Bekleyen Davetler</h2>
          <div className="mt-3 divide-y divide-slate-800/60">
            {davetler.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="text-slate-200">{d.email}</p>
                  <p className="text-[11px] text-slate-500">
                    {ROL_ADLARI[d.role]} · {new Date(d.expires_at).toLocaleDateString("tr-TR")} tarihine kadar geçerli
                  </p>
                </div>
                {benimRolMasterMi && (
                  <button
                    onClick={() => davetIptal(d.id)}
                    disabled={islenenId === d.id}
                    className="rounded-lg border border-red-600/40 px-3 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    İptal Et
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Katılım</th>
              {benimRolMasterMi && <th className="px-4 py-3 text-right font-medium">İşlem</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {adminler.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-slate-800/30">
                <td className="px-4 py-2.5">
                  <span className="text-slate-200">{a.email}</span>
                  {a.id === benimId && <span className="ml-1.5 text-[11px] text-slate-500">(siz)</span>}
                </td>
                <td className="px-4 py-2.5">
                  {benimRolMasterMi ? (
                    <select
                      value={a.role}
                      onChange={(e) => rolDegistir(a.id, e.target.value)}
                      disabled={islenenId === a.id}
                      className="rounded-lg border border-slate-700 bg-surface px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-500 disabled:opacity-50"
                    >
                      {ROLLER.map((r) => (
                        <option key={r} value={r}>
                          {ROL_ADLARI[r]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-400">{ROL_ADLARI[a.role] ?? a.role}</span>
                  )}
                </td>
                <td className="hidden px-4 py-2.5 text-xs text-slate-500 sm:table-cell">
                  {new Date(a.granted_at).toLocaleDateString("tr-TR")}
                </td>
                {benimRolMasterMi && (
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => kaldir(a.id)}
                      disabled={islenenId === a.id}
                      className="rounded-lg border border-red-600/40 px-3 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Kaldır
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
