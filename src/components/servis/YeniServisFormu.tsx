"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { CihazSecVeyaOlustur } from "./CihazSecVeyaOlustur";
import {
  ONCELIKLER,
  KONTROL_LISTESI_SABLONLARI,
  KABUL_BEYAN_METNI,
} from "@/lib/servis";

type Musteri = { id: string; name: string; phone: string | null };
type Cihaz = {
  id: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function YeniServisFormu({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [cihaz, setCihaz] = useState<Cihaz | null>(null);
  const [beyan, setBeyan] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [aksesuarGirisi, setAksesuarGirisi] = useState("");
  const [aksesuarlar, setAksesuarlar] = useState<string[]>([]);
  const [oncelik, setOncelik] = useState("normal");
  const [onay, setOnay] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const checklistMaddeleri = useMemo(
    () => (cihaz ? KONTROL_LISTESI_SABLONLARI[cihaz.device_type] ?? [] : []),
    [cihaz]
  );

  function musteriSec(m: Musteri | null) {
    setMusteri(m);
    setCihaz(null); // müşteri değişince cihaz seçimi sıfırlanır
  }

  function aksesuarEkle() {
    const deger = aksesuarGirisi.trim();
    if (!deger || aksesuarlar.includes(deger)) return;
    setAksesuarlar((a) => [...a, deger]);
    setAksesuarGirisi("");
  }

  function aksesuarSil(deger: string) {
    setAksesuarlar((a) => a.filter((x) => x !== deger));
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);

    if (!musteri) return setHata("Lütfen müşteri seçin.");
    if (!cihaz) return setHata("Lütfen cihaz seçin veya oluşturun.");
    if (!beyan.trim()) return setHata("Müşteri beyanını (arıza) yazın.");
    if (!onay)
      return setHata("Devam etmek için servis kabul koşullarını onaylayın.");

    setYukleniyor(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("service_orders")
      .insert({
        tenant_id: tenantId,
        customer_id: musteri.id,
        device_id: cihaz.id,
        priority: oncelik,
        declared_issue: beyan.trim(),
        physical_condition: checklist,
        accessories: aksesuarlar.map((ad) => ({ name: ad, delivered: false })),
        consent_accepted: true,
        consent_accepted_at: new Date().toISOString(),
        created_by: user?.id,
      })
      .select("id, service_no")
      .single();

    setYukleniyor(false);

    if (error || !data) {
      setHata("Servis kaydı oluşturulamadı. Lütfen tekrar deneyin.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "servis_olusturuldu",
      p_entity: "service_order",
      p_entity_id: data.id,
      p_new: { service_no: data.service_no, customer: musteri.name },
    });

    router.push(`/panel/servisler/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={kaydet} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Müşteri *
        </label>
        <MusteriSec secili={musteri} onSec={musteriSec} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Cihaz *
        </label>
        <CihazSecVeyaOlustur
          musteriId={musteri?.id ?? null}
          tenantId={tenantId}
          secili={cihaz}
          onSec={setCihaz}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Müşteri beyanı (arıza) *
        </label>
        <textarea
          rows={2}
          value={beyan}
          onChange={(e) => setBeyan(e.target.value)}
          placeholder='Örn: "Açılmıyor, şarj etsem de tepki vermiyor."'
          className={`${alanSinifi} resize-none`}
        />
      </div>

      {cihaz && checklistMaddeleri.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Fiziksel kabul kontrolü
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 bg-surface-2 p-3 sm:grid-cols-3">
            {checklistMaddeleri.map((madde) => (
              <label
                key={madde}
                className="flex items-center gap-2 text-xs text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={checklist[madde] ?? false}
                  onChange={(e) =>
                    setChecklist((c) => ({ ...c, [madde]: e.target.checked }))
                  }
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0 focus:ring-offset-0"
                />
                {madde}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            İşaretli olanlar &quot;sorunsuz&quot; kabul edilir.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Teslim alınan aksesuarlar
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={aksesuarGirisi}
            onChange={(e) => setAksesuarGirisi(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                aksesuarEkle();
              }
            }}
            placeholder="Örn: adaptör, çanta…"
            className={alanSinifi}
          />
          <button
            type="button"
            onClick={aksesuarEkle}
            className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-nova-500/50"
          >
            Ekle
          </button>
        </div>
        {aksesuarlar.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {aksesuarlar.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300"
              >
                {a}
                <button
                  type="button"
                  onClick={() => aksesuarSil(a)}
                  className="text-slate-500 hover:text-red-300"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Öncelik
        </label>
        <div className="flex gap-2">
          {ONCELIKLER.map((o) => (
            <button
              key={o.deger}
              type="button"
              onClick={() => setOncelik(o.deger)}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                oncelik === o.deger
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {o.etiket}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-slate-400">
        <input
          type="checkbox"
          checked={onay}
          onChange={(e) => setOnay(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0 focus:ring-offset-0"
        />
        {KABUL_BEYAN_METNI}
      </label>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {hata}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={yukleniyor}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
        >
          {yukleniyor ? "Kaydediliyor…" : "Servisi Kabul Et"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
