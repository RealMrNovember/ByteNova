"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraFormatla } from "@/lib/doviz";

type Props = {
  servisId: string;
  yetkili: boolean;
  mevcutUcret: number | null;
  ucretTahsilEdildi: boolean;
};

export function TeshisUcreti({ servisId, yetkili, mevcutUcret, ucretTahsilEdildi }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [ucret, setUcret] = useState(mevcutUcret?.toString() ?? "");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  if (ucretTahsilEdildi) {
    return (
      <div className="glass rounded-xl border border-amber-500/20 p-4 text-sm text-amber-300">
        💰 Müşteri teklifi reddetti — ücretli teşhis bedeli {paraFormatla(mevcutUcret ?? 0)} olarak
        kaydedildi. Tahsilatı Kapora/Avans bölümünden alabilirsiniz.
      </div>
    );
  }

  if (!yetkili) return null;

  async function uygula() {
    const sayi = Number(ucret);
    if (!sayi || sayi <= 0) {
      setHata("Geçerli bir ücret girin.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("servis_teshis_ucreti_uygula", {
      p_service_id: servisId,
      p_ucret: sayi,
    });
    setYukleniyor(false);
    if (error) {
      setHata("İşlem uygulanamadı.");
      return;
    }
    setAcik(false);
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="rounded-lg border border-amber-600/40 px-3.5 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/10"
      >
        💰 Müşteri Teklifi Reddetti — Ücretli Teşhis Uygula
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-slate-400">
        Müşteri onarım teklifini reddetti. Kabul formunda beyan edilen ücretli teşhis bedelini
        girin — cihaz teslim bekleyen duruma geçecek.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={ucret}
          onChange={(e) => setUcret(e.target.value)}
          placeholder="Teşhis ücreti (TL)"
          className="w-40 rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-500"
        />
        <button
          onClick={uygula}
          disabled={yukleniyor}
          className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
        >
          {yukleniyor ? "…" : "Uygula"}
        </button>
        <button
          onClick={() => setAcik(false)}
          className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
        >
          Vazgeç
        </button>
      </div>
      {hata && <p className="mt-2 text-xs text-red-300">{hata}</p>}
    </div>
  );
}
