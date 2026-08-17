"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cihazIkon } from "@/lib/cihaz";
import { DURUMLAR, KANBAN_KOLONLARI, kanbanKolonuBul, oncelikBul } from "@/lib/servis";

type Servis = {
  id: string;
  service_no: string;
  status: string;
  priority: string;
  technician_id: string | null;
  customers: { name: string } | null;
  devices: { device_type: string; brand: string | null; model: string | null } | null;
};

type Props = {
  servisler: Servis[];
  kullanicilar: { id: string; full_name: string | null }[];
};

export function ServisKanban({ servisler, kullanicilar }: Props) {
  const router = useRouter();
  const [acikKart, setAcikKart] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState<string | null>(null);

  const adSozlugu = new Map(kullanicilar.map((k) => [k.id, k.full_name ?? "İsimsiz"]));
  const teknisyenAdi = (id: string | null) => (id ? (adSozlugu.get(id) ?? "—") : "—");

  async function durumDegistir(servisId: string, yeniDurum: string) {
    setKaydediliyor(servisId);
    const supabase = createClient();
    await supabase.from("service_orders").update({ status: yeniDurum }).eq("id", servisId);
    setKaydediliyor(null);
    setAcikKart(null);
    router.refresh();
  }

  return (
    <div className="mt-6 flex gap-3 overflow-x-auto pb-3">
      {KANBAN_KOLONLARI.map((kolon) => {
        const kartlar = servisler.filter((s) => kanbanKolonuBul(s.status) === kolon.baslik);
        return (
          <div key={kolon.baslik} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-slate-300">{kolon.baslik}</h3>
              <span className="text-[11px] text-slate-600">{kartlar.length}</span>
            </div>
            <div className="space-y-2">
              {kartlar.map((s) => {
                const oncelik = oncelikBul(s.priority);
                return (
                  <div key={s.id} className="glass rounded-lg p-3">
                    <Link
                      href={`/panel/servisler/${s.id}`}
                      className="font-mono text-[11px] font-medium text-nova-300"
                    >
                      {s.service_no}
                    </Link>
                    <p className="mt-1 truncate text-sm text-slate-200">{s.customers?.name ?? "—"}</p>
                    {s.devices && (
                      <p className="truncate text-[11px] text-slate-500">
                        {cihazIkon(s.devices.device_type)}{" "}
                        {[s.devices.brand, s.devices.model].filter(Boolean).join(" ")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${oncelik.sinif}`}>
                        {oncelik.etiket}
                      </span>
                      <span className="truncate text-[10px] text-slate-500">{teknisyenAdi(s.technician_id)}</span>
                    </div>
                    {acikKart === s.id ? (
                      <select
                        autoFocus
                        defaultValue={s.status}
                        disabled={kaydediliyor === s.id}
                        onChange={(e) => durumDegistir(s.id, e.target.value)}
                        onBlur={() => setAcikKart(null)}
                        className="mt-2 w-full rounded-lg border border-nova-500/50 bg-surface px-2 py-1 text-[11px] text-slate-200 outline-none"
                      >
                        {DURUMLAR.map((d) => (
                          <option key={d.deger} value={d.deger}>
                            {d.etiket}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setAcikKart(s.id)}
                        className="mt-2 w-full rounded-lg border border-slate-800 px-2 py-1 text-[11px] text-slate-500 hover:border-nova-500/40 hover:text-nova-300"
                      >
                        Durum değiştir
                      </button>
                    )}
                  </div>
                );
              })}
              {kartlar.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-[11px] text-slate-600">
                  Boş
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
