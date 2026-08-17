"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DURUM_ETIKETLERI, sonrakiAdim, type ToplamaDurum } from "@/lib/toplama";

type Checklist = { label: string; checked: boolean }[];

type Props = {
  orderId: string;
  status: ToplamaDurum;
  checklist: Checklist;
  toplamMaliyet: number;
};

export function ToplamaIslemleri({ orderId, status, checklist, toplamMaliyet }: Props) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [tamamlaAcik, setTamamlaAcik] = useState(false);
  const [urunAdi, setUrunAdi] = useState("");
  const [satisFiyati, setSatisFiyati] = useState("");
  const [seriNo, setSeriNo] = useState("");

  const sonraki = sonrakiAdim(status);

  async function checklistDegistir(index: number) {
    const supabase = createClient();
    await supabase.rpc("toplama_checklist_guncelle", {
      p_order_id: orderId,
      p_index: index,
      p_checked: !checklist[index].checked,
    });
    router.refresh();
  }

  async function ilerlet(durum: ToplamaDurum) {
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("toplama_durum_ilerlet", { p_order_id: orderId, p_yeni_durum: durum });
    setYukleniyor(false);
    if (error) {
      setHata(error.message.includes("STOK_YETERSIZ") || error.message.includes("NEGATIF_STOK")
        ? "Bazı parçalarda yeterli stok yok."
        : "İşlem yapılamadı.");
      return;
    }
    router.refresh();
  }

  async function iptalEt() {
    await ilerlet("iptal");
  }

  async function tamamla() {
    if (!urunAdi.trim() || !satisFiyati) {
      setHata("Ürün adı ve satış fiyatı gerekli.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("toplama_tamamla", {
      p_order_id: orderId,
      p_urun_adi: urunAdi.trim(),
      p_satis_fiyati: Number(satisFiyati),
      p_seri_no: seriNo.trim() || null,
    });
    setYukleniyor(false);
    if (error || !data) {
      setHata("Tamamlanamadı.");
      return;
    }
    router.push(`/panel/stok/${data}`);
    router.refresh();
  }

  if (status === "tamamlandi" || status === "iptal") return null;

  return (
    <div className="glass mt-4 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">İşlemler</h2>

      {status !== "taslak" && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-slate-400">Test Checklist</p>
          {checklist.map((c, i) => (
            <label key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={c.checked}
                onChange={() => checklistDegistir(i)}
                className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0"
              />
              {c.label}
            </label>
          ))}
        </div>
      )}

      {hata && (
        <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{hata}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {sonraki && sonraki !== "tamamlandi" && (
          <button
            type="button"
            onClick={() => ilerlet(sonraki)}
            disabled={yukleniyor}
            className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
          >
            {yukleniyor ? "İşleniyor…" : `${DURUM_ETIKETLERI[sonraki]} olarak işaretle`}
          </button>
        )}
        {sonraki === "tamamlandi" && !tamamlaAcik && (
          <button
            type="button"
            onClick={() => setTamamlaAcik(true)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            ✓ Toplamayı Tamamla
          </button>
        )}
        {status !== "taslak" && (
          <button
            type="button"
            onClick={iptalEt}
            disabled={yukleniyor}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
          >
            İptal Et (parçaları stoğa iade et)
          </button>
        )}
      </div>

      {tamamlaAcik && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-xs text-slate-400">
            Toplam maliyet (parçalar + işçilik): <strong className="text-slate-200">{toplamMaliyet.toLocaleString("tr-TR")} ₺</strong>
          </p>
          <input
            type="text"
            value={urunAdi}
            onChange={(e) => setUrunAdi(e.target.value)}
            placeholder="Yeni ürün adı (örn: Oyun PC'si #001)"
            className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              step="0.01"
              min="0"
              value={satisFiyati}
              onChange={(e) => setSatisFiyati(e.target.value)}
              placeholder="Satış fiyatı (TL)"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
            <input
              type="text"
              value={seriNo}
              onChange={(e) => setSeriNo(e.target.value)}
              placeholder="Seri no (opsiyonel)"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={tamamla}
              disabled={yukleniyor}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {yukleniyor ? "Kaydediliyor…" : "Kaydet ve Stoğa Ekle"}
            </button>
            <button
              type="button"
              onClick={() => setTamamlaAcik(false)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
