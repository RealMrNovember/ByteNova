"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function YeniKasaHesabi({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [ad, setAd] = useState("");
  const [tip, setTip] = useState<"nakit" | "banka" | "pos">("nakit");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function kaydet() {
    if (!ad.trim()) {
      setHata("Hesap adı gerekli.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("cash_accounts")
      .insert({ tenant_id: tenantId, name: ad.trim(), type: tip, created_by: user?.id })
      .select("id")
      .single();

    setKaydediliyor(false);
    if (error || !data) {
      setHata("Hesap oluşturulamadı.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "kasa_hesabi_olusturuldu",
      p_entity: "cash_account",
      p_entity_id: data.id,
      p_new: { name: ad.trim(), type: tip },
    });

    setAd("");
    setTip("nakit");
    setAcik(false);
    router.refresh();
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400"
      >
        + Yeni Hesap
      </button>
    );
  }

  return (
    <div className="glass w-full max-w-sm rounded-xl p-4 sm:absolute sm:right-0 sm:top-11 sm:z-30 sm:shadow-xl">
      <p className="text-xs font-medium text-slate-300">Yeni Kasa Hesabı</p>
      <input
        type="text"
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        placeholder="Örn: Ana Kasa, Garanti POS"
        className="mt-2 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
      />
      <select
        value={tip}
        onChange={(e) => setTip(e.target.value as "nakit" | "banka" | "pos")}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
      >
        <option value="nakit">Nakit</option>
        <option value="banka">Banka</option>
        <option value="pos">POS</option>
      </select>
      {hata && <p className="mt-2 text-[11px] text-red-300">{hata}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={kaydet}
          disabled={kaydediliyor}
          className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          onClick={() => setAcik(false)}
          className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
