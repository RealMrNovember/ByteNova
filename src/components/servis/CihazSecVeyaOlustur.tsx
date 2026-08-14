"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CIHAZ_TURLERI, cihazIkon } from "@/lib/cihaz";

type Cihaz = {
  id: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
};

type Props = {
  musteriId: string | null;
  tenantId: string;
  secili: Cihaz | null;
  onSec: (c: Cihaz | null) => void;
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function CihazSecVeyaOlustur({
  musteriId,
  tenantId,
  secili,
  onSec,
}: Props) {
  const [mevcutCihazlar, setMevcutCihazlar] = useState<Cihaz[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yeniModu, setYeniModu] = useState(false);

  const [tur, setTur] = useState("laptop");
  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [seriNo, setSeriNo] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!musteriId) {
      setMevcutCihazlar([]);
      return;
    }
    setYukleniyor(true);
    createClient()
      .from("devices")
      .select("id, device_type, brand, model, serial_no")
      .eq("customer_id", musteriId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMevcutCihazlar(data ?? []);
        setYukleniyor(false);
      });
  }, [musteriId]);

  async function yeniCihazKaydet() {
    setHata(null);
    setKaydediliyor(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("devices")
      .insert({
        tenant_id: tenantId,
        customer_id: musteriId,
        device_type: tur,
        brand: marka.trim() || null,
        model: model.trim() || null,
        serial_no: seriNo.trim() || null,
        created_by: user?.id,
      })
      .select("id, device_type, brand, model, serial_no")
      .single();

    setKaydediliyor(false);

    if (error || !data) {
      setHata(
        error?.code === "23505"
          ? "Bu seri numarası zaten kayıtlı. Ctrl+K ile arayıp mevcut cihazı bulabilirsiniz."
          : "Cihaz kaydedilemedi."
      );
      return;
    }

    await supabase.from("device_events").insert({
      tenant_id: tenantId,
      device_id: data.id,
      user_id: user?.id,
      kind: "created",
      content: "Servis kabulü sırasında cihaz kaydı oluşturuldu.",
    });

    onSec(data);
    setYeniModu(false);
  }

  if (!musteriId) {
    return (
      <p className="rounded-lg border border-dashed border-slate-800 px-3.5 py-3 text-xs text-slate-600">
        Önce müşteri seçin.
      </p>
    );
  }

  if (secili) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-nova-500/40 bg-nova-500/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{cihazIkon(secili.device_type)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-nova-200">
              {[secili.brand, secili.model].filter(Boolean).join(" ") ||
                "İsimsiz cihaz"}
            </p>
            {secili.serial_no && (
              <p className="font-mono text-xs text-slate-500">
                {secili.serial_no}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSec(null)}
          className="ml-3 shrink-0 text-xs text-slate-400 hover:text-red-300"
        >
          ✕ Değiştir
        </button>
      </div>
    );
  }

  if (yeniModu) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-700 bg-surface-2 p-3.5">
        <div className="grid grid-cols-4 gap-1.5">
          {CIHAZ_TURLERI.map((t) => (
            <button
              key={t.deger}
              type="button"
              onClick={() => setTur(t.deger)}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-1.5 py-2 text-[11px] transition-colors ${
                tur === t.deger
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              <span className="text-base">{t.ikon}</span>
              {t.etiket}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={marka}
            onChange={(e) => setMarka(e.target.value)}
            placeholder="Marka"
            className={alanSinifi}
          />
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
            className={alanSinifi}
          />
        </div>
        <input
          value={seriNo}
          onChange={(e) => setSeriNo(e.target.value)}
          placeholder="Seri numarası (varsa)"
          className={`${alanSinifi} font-mono`}
        />
        {hata && <p className="text-xs text-red-300">{hata}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={yeniCihazKaydet}
            disabled={kaydediliyor}
            className="rounded-lg bg-nova-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:opacity-60"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Cihazı Kaydet ve Seç"}
          </button>
          <button
            type="button"
            onClick={() => setYeniModu(false)}
            className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs text-slate-300"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {yukleniyor ? (
        <div className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
      ) : mevcutCihazlar.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-500">
            Bu müşteriye kayıtlı cihazlar:
          </p>
          {mevcutCihazlar.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSec(c)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-slate-700 px-3.5 py-2 text-left text-sm transition-colors hover:border-nova-500/50 hover:bg-nova-500/5"
            >
              <span>{cihazIkon(c.device_type)}</span>
              <span className="flex-1 text-slate-200">
                {[c.brand, c.model].filter(Boolean).join(" ") || "İsimsiz cihaz"}
              </span>
              {c.serial_no && (
                <span className="font-mono text-xs text-slate-500">
                  {c.serial_no}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-600">
          Bu müşteriye kayıtlı cihaz yok.
        </p>
      )}
      <button
        type="button"
        onClick={() => setYeniModu(true)}
        className="w-full rounded-lg border border-dashed border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-nova-500/50 hover:text-nova-300"
      >
        + Yeni cihaz ekle
      </button>
    </div>
  );
}
