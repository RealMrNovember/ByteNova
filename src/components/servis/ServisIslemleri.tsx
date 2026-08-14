"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DURUMLAR, durumSinifi } from "@/lib/servis";

type Kullanici = { id: string; full_name: string | null; role: string };
type Not = {
  id: number;
  content: string;
  created_at: string;
  user_id: string | null;
  yazan: string;
};

type Props = {
  servisId: string;
  tenantId: string;
  mevcutDurum: string;
  mevcutTeknisyenId: string | null;
  kullanicilar: Kullanici[];
  notlar: Not[];
  yetkili: boolean;
};

export function ServisIslemleri({
  servisId,
  tenantId,
  mevcutDurum,
  mevcutTeknisyenId,
  kullanicilar,
  notlar: ilkNotlar,
  yetkili,
}: Props) {
  const router = useRouter();
  const [durum, setDurum] = useState(mevcutDurum);
  const [teknisyenId, setTeknisyenId] = useState(mevcutTeknisyenId ?? "");
  const [durumKaydediliyor, setDurumKaydediliyor] = useState(false);
  const [teknisyenKaydediliyor, setTeknisyenKaydediliyor] = useState(false);

  const [notlar, setNotlar] = useState(ilkNotlar);
  const [yeniNot, setYeniNot] = useState("");
  const [notEkleniyor, setNotEkleniyor] = useState(false);

  async function durumGuncelle() {
    if (durum === mevcutDurum) return;
    setDurumKaydediliyor(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("service_orders")
      .update({ status: durum })
      .eq("id", servisId);
    setDurumKaydediliyor(false);
    if (!error) router.refresh();
  }

  async function teknisyenAta() {
    setTeknisyenKaydediliyor(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("service_orders")
      .update({ technician_id: teknisyenId || null })
      .eq("id", servisId);

    if (!error) {
      const atanan = kullanicilar.find((k) => k.id === teknisyenId);
      await supabase.rpc("audit_ekle", {
        p_action: "servis_teknisyen_atandi",
        p_entity: "service_order",
        p_entity_id: servisId,
        p_new: { technician: atanan?.full_name ?? null },
      });
      router.refresh();
    }
    setTeknisyenKaydediliyor(false);
  }

  async function notEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniNot.trim()) return;
    setNotEkleniyor(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("service_notes")
      .insert({
        tenant_id: tenantId,
        service_order_id: servisId,
        user_id: user?.id,
        content: yeniNot.trim(),
      })
      .select("id, content, created_at, user_id")
      .single();

    setNotEkleniyor(false);

    if (!error && data) {
      const ben = kullanicilar.find((k) => k.id === user?.id);
      setNotlar((n) => [
        { ...data, yazan: ben?.full_name ?? "Siz" },
        ...n,
      ]);
      setYeniNot("");
    }
  }

  return (
    <div className="space-y-4">
      {yetkili && (
        <div className="glass grid gap-4 rounded-xl p-5 sm:grid-cols-2">
          {/* Durum değiştirme */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Servis Durumu
            </label>
            <div className="flex gap-2">
              <select
                value={durum}
                onChange={(e) => setDurum(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              >
                {DURUMLAR.map((d) => (
                  <option key={d.deger} value={d.deger}>
                    {d.etiket}
                  </option>
                ))}
              </select>
              <button
                onClick={durumGuncelle}
                disabled={durumKaydediliyor || durum === mevcutDurum}
                className="shrink-0 rounded-lg bg-nova-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {durumKaydediliyor ? "…" : "Güncelle"}
              </button>
            </div>
          </div>

          {/* Teknisyen atama */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Teknisyen
            </label>
            <div className="flex gap-2">
              <select
                value={teknisyenId}
                onChange={(e) => setTeknisyenId(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              >
                <option value="">— Atanmadı —</option>
                {kullanicilar.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.full_name ?? "İsimsiz"}
                  </option>
                ))}
              </select>
              <button
                onClick={teknisyenAta}
                disabled={teknisyenKaydediliyor || teknisyenId === (mevcutTeknisyenId ?? "")}
                className="shrink-0 rounded-lg bg-nova-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {teknisyenKaydediliyor ? "…" : "Ata"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teknik notlar */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Teknik Notlar</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Ekip içi notlar — müşteriye gösterilmez.
        </p>

        <form onSubmit={notEkle} className="mt-4 flex gap-2">
          <input
            type="text"
            value={yeniNot}
            onChange={(e) => setYeniNot(e.target.value)}
            placeholder='Örn: "Fan temizliği yapıldı, termal macun yenilendi."'
            className="flex-1 rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
          />
          <button
            type="submit"
            disabled={notEkleniyor || !yeniNot.trim()}
            className="shrink-0 rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ekle
          </button>
        </form>

        {notlar.length === 0 ? (
          <p className="mt-5 text-center text-xs text-slate-600">
            Henüz teknik not yok.
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {notlar.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-nova-300">
                    {n.yazan}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(n.created_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!yetkili && (
        <p className="text-center text-[11px] text-slate-600">
          Durum ve teknisyen değişikliği için yönetici/teknisyen yetkisi
          gerekir.
        </p>
      )}
    </div>
  );
}
