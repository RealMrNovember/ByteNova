"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { kasaKapanisiniGeriAl } from "@/app/konsol/(app)/[id]/actions";

export function KasaKapanisiGeriAl({ closingId }: { closingId: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [neden, setNeden] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder() {
    if (!neden.trim()) {
      setHata("Gerekçe zorunlu.");
      return;
    }
    setGonderiliyor(true);
    setHata(null);
    const sonuc = await kasaKapanisiniGeriAl(closingId, neden);
    setGonderiliyor(false);
    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    setAcik(false);
    setNeden("");
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="shrink-0 rounded-lg border border-red-500/30 px-2.5 py-1 text-[11px] font-medium text-red-300 transition hover:border-red-500/60 hover:bg-red-500/10"
      >
        Geri Al
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-red-500/25 bg-red-500/5 p-3">
      <p className="text-[11px] text-red-200">
        Bu kapanış geri alınacak, kasa bakiyesi kapanış öncesine döndürülecek
        ve işlem hem platform kaydına hem işletmenin kendi denetim
        geçmişine işlenecek.
      </p>
      <input
        type="text"
        autoFocus
        value={neden}
        onChange={(e) => setNeden(e.target.value)}
        placeholder="Gerekçe (zorunlu, işletmeye görünür)"
        className="mt-2 w-full rounded-lg border border-slate-700 bg-surface px-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-500/50"
      />
      {hata && <p className="mt-1.5 text-[11px] text-red-300">{hata}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={gonder}
          disabled={gonderiliyor}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-red-400 disabled:opacity-60"
        >
          {gonderiliyor ? "Gönderiliyor…" : "Onayla, Geri Al"}
        </button>
        <button
          onClick={() => setAcik(false)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
