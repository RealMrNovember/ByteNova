"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CIHAZ_TURLERI } from "@/lib/cihaz";
import { MusteriSec } from "./MusteriSec";

type Mevcut = {
  id: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  imei: string | null;
  mac_address: string | null;
  notes: string | null;
  customer_id: string | null;
};

type Props = {
  tenantId: string;
  mevcut?: Mevcut;
  mevcutMusteri?: { id: string; name: string; phone: string | null } | null;
  onVarsayilanMusteri?: { id: string; name: string; phone: string | null } | null;
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function CihazFormu({
  tenantId,
  mevcut,
  mevcutMusteri,
  onVarsayilanMusteri,
}: Props) {
  const router = useRouter();
  const [tur, setTur] = useState(mevcut?.device_type ?? "laptop");
  const [marka, setMarka] = useState(mevcut?.brand ?? "");
  const [model, setModel] = useState(mevcut?.model ?? "");
  const [seriNo, setSeriNo] = useState(mevcut?.serial_no ?? "");
  const [imei, setImei] = useState(mevcut?.imei ?? "");
  const [mac, setMac] = useState(mevcut?.mac_address ?? "");
  const [not, setNot] = useState(mevcut?.notes ?? "");
  const [musteri, setMusteri] = useState(
    mevcutMusteri ?? onVarsayilanMusteri ?? null
  );
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const telefonTuru = tur === "phone" || tur === "tablet";

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const kayit = {
      device_type: tur,
      brand: marka.trim() || null,
      model: model.trim() || null,
      serial_no: seriNo.trim() || null,
      imei: telefonTuru ? imei.trim() || null : null,
      mac_address: mac.trim() || null,
      notes: not.trim() || null,
      customer_id: musteri?.id ?? null,
    };

    if (mevcut) {
      const { error } = await supabase
        .from("devices")
        .update(kayit)
        .eq("id", mevcut.id);
      setYukleniyor(false);
      if (error) {
        setHata(
          error.code === "23505"
            ? "Bu seri numarası işletmenizde başka bir cihazda kayıtlı."
            : "Cihaz güncellenemedi. Lütfen tekrar deneyin."
        );
        return;
      }
      if (mevcut.customer_id !== (musteri?.id ?? null)) {
        await supabase.from("device_events").insert({
          tenant_id: tenantId,
          device_id: mevcut.id,
          kind: "ownership",
          content: musteri
            ? `Cihaz ${musteri.name} adlı müşteriye bağlandı.`
            : "Cihazın müşteri bağlantısı kaldırıldı.",
        });
      }
      await supabase.rpc("audit_ekle", {
        p_action: "cihaz_guncellendi",
        p_entity: "device",
        p_entity_id: mevcut.id,
      });
      router.push(`/panel/cihazlar/${mevcut.id}`);
      router.refresh();
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("devices")
        .insert({ ...kayit, tenant_id: tenantId, created_by: user?.id })
        .select("id")
        .single();
      setYukleniyor(false);
      if (error || !data) {
        setHata(
          error?.code === "23505"
            ? "Bu seri numarası işletmenizde zaten kayıtlı. Global aramadan (Ctrl+K) bulabilirsiniz."
            : "Cihaz kaydedilemedi. Lütfen tekrar deneyin."
        );
        return;
      }
      await supabase.from("device_events").insert({
        tenant_id: tenantId,
        device_id: data.id,
        user_id: user?.id,
        kind: "created",
        content: musteri
          ? `Cihaz kaydı oluşturuldu — sahibi: ${musteri.name}`
          : "Cihaz kaydı oluşturuldu.",
      });
      await supabase.rpc("audit_ekle", {
        p_action: "cihaz_olusturuldu",
        p_entity: "device",
        p_entity_id: data.id,
        p_new: { serial_no: kayit.serial_no },
      });
      router.push(`/panel/cihazlar/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-4">
      {/* Tür seçimi */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Cihaz türü
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CIHAZ_TURLERI.map((t) => (
            <button
              key={t.deger}
              type="button"
              onClick={() => setTur(t.deger)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition-colors ${
                tur === t.deger
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              <span className="text-lg">{t.ikon}</span>
              {t.etiket}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Marka
          </label>
          <input
            type="text"
            value={marka}
            onChange={(e) => setMarka(e.target.value)}
            placeholder="Lenovo, Apple, HP…"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="ThinkPad T14, iPhone 15…"
            className={alanSinifi}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Seri numarası
          </label>
          <input
            type="text"
            value={seriNo}
            onChange={(e) => setSeriNo(e.target.value)}
            placeholder="Cihaz etiketindeki S/N"
            className={`${alanSinifi} font-mono`}
          />
        </div>
        {telefonTuru ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              IMEI
            </label>
            <input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              placeholder="*#06# ile görüntülenir"
              className={`${alanSinifi} font-mono`}
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              MAC adresi <span className="text-slate-600">(opsiyonel)</span>
            </label>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              className={`${alanSinifi} font-mono`}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Sahibi (müşteri)
        </label>
        <MusteriSec secili={musteri} onSec={setMusteri} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Notlar
        </label>
        <textarea
          rows={2}
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Fiziksel durum, özel notlar…"
          className={`${alanSinifi} resize-none`}
        />
      </div>

      {hata && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {hata}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={yukleniyor}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-60"
        >
          {yukleniyor
            ? "Kaydediliyor…"
            : mevcut
              ? "Değişiklikleri Kaydet"
              : "Cihazı Kaydet"}
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
