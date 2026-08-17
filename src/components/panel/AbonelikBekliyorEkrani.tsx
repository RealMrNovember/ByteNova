"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cikisYap } from "@/app/panel/actions";

type Props = {
  tenantId: string;
  yukleyebilir: boolean;
};

export function AbonelikBekliyorEkrani({ tenantId, yukleyebilir }: Props) {
  const router = useRouter();
  const [dosya, setDosya] = useState<File | null>(null);
  const [tutar, setTutar] = useState("");
  const [not, setNot] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  async function gonder() {
    if (!dosya) {
      setHata("Dekont dosyası seçin.");
      return;
    }
    if (dosya.size > 5 * 1024 * 1024) {
      setHata("Dekont dosyası en fazla 5 MB olabilir.");
      return;
    }
    setYukleniyor(true);
    setHata(null);

    const supabase = createClient();
    const uzanti = dosya.name.split(".").pop() ?? "jpg";
    const yol = `${tenantId}/dekont/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${uzanti}`;

    const { error: yuklemeHatasi } = await supabase.storage
      .from("servis-belgeleri")
      .upload(yol, dosya, { contentType: dosya.type });
    if (yuklemeHatasi) {
      setYukleniyor(false);
      setHata("Dekont yüklenemedi.");
      return;
    }

    const { error } = await supabase.rpc("dekont_yukle", {
      p_storage_path: yol,
      p_tutar: tutar ? Number(tutar) : null,
      p_not: not.trim() || null,
    });

    setYukleniyor(false);
    if (error) {
      setHata("Dekont kaydedilemedi.");
      return;
    }
    setGonderildi(true);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-16">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        <span className="text-4xl">⏸️</span>
        <h1 className="mt-4 text-lg font-bold text-white">Aboneliğiniz Beklemede</h1>
        <p className="mt-2 text-sm text-slate-400">
          İşletme paneliniz geçici olarak durduruldu. Verileriniz güvende — silinmedi.
          Erişimin yeniden açılması için ödemenizi tamamlayın.
        </p>

        {yukleyebilir ? (
          gonderildi ? (
            <div className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Dekontunuz alındı. İncelendikten sonra hesabınız otomatik olarak
              yeniden etkinleşecek.
            </div>
          ) : (
            <div className="mt-6 space-y-3 text-left">
              <p className="text-xs font-medium text-slate-300">Ödeme Dekontu Yükleyin</p>
              <label className="block cursor-pointer rounded-lg border border-dashed border-slate-700 px-4 py-3 text-center text-xs text-slate-500 hover:border-nova-500/50 hover:text-slate-300">
                {dosya ? `📎 ${dosya.name}` : "📎 Dekont dosyası seç (görsel/PDF)"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="Tutar (opsiyonel)"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
              />
              <input
                type="text"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Not (opsiyonel)"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
              />
              {hata && <p className="text-xs text-red-300">{hata}</p>}
              <button
                onClick={gonder}
                disabled={yukleniyor}
                className="w-full rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
              >
                {yukleniyor ? "Gönderiliyor…" : "Dekontu Gönder"}
              </button>
            </div>
          )
        ) : (
          <p className="mt-6 text-xs text-slate-500">
            Ödeme işlemi için lütfen işletme sahibinizle veya yöneticinizle iletişime geçin.
          </p>
        )}

        <form action={cikisYap} className="mt-6">
          <button
            type="submit"
            className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            Çıkış yap
          </button>
        </form>
      </div>
    </div>
  );
}
