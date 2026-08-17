"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mevcut = {
  id: string;
  name: string;
  currency: string;
  iban: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_taxpayer: boolean;
};

type Props = {
  tenantId: string;
  mevcut?: Mevcut;
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function TedarikciFormu({ tenantId, mevcut }: Props) {
  const router = useRouter();
  const [ad, setAd] = useState(mevcut?.name ?? "");
  const [paraBirimi, setParaBirimi] = useState(mevcut?.currency ?? "TRY");
  const [iban, setIban] = useState(mevcut?.iban ?? "");
  const [telefon, setTelefon] = useState(mevcut?.phone ?? "");
  const [adres, setAdres] = useState(mevcut?.address ?? "");
  const [notlar, setNotlar] = useState(mevcut?.notes ?? "");
  const [mukellef, setMukellef] = useState(mevcut?.is_taxpayer ?? true);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) {
      setHata("Tedarikçi adı gerekli.");
      return;
    }
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const kayit = {
      name: ad.trim(),
      currency: paraBirimi,
      iban: iban.trim() || null,
      phone: telefon.trim() || null,
      address: adres.trim() || null,
      notes: notlar.trim() || null,
      is_taxpayer: mukellef,
    };

    if (mevcut) {
      const { error } = await supabase.from("suppliers").update(kayit).eq("id", mevcut.id);
      setYukleniyor(false);
      if (error) {
        setHata("Tedarikçi güncellenemedi.");
        return;
      }
      await supabase.rpc("audit_ekle", {
        p_action: "tedarikci_guncellendi",
        p_entity: "supplier",
        p_entity_id: mevcut.id,
      });
      router.push(`/panel/tedarikciler/${mevcut.id}`);
      router.refresh();
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("suppliers")
        .insert({ ...kayit, tenant_id: tenantId, created_by: user?.id })
        .select("id")
        .single();
      setYukleniyor(false);
      if (error || !data) {
        setHata("Tedarikçi kaydedilemedi.");
        return;
      }
      await supabase.rpc("audit_ekle", {
        p_action: "tedarikci_olusturuldu",
        p_entity: "supplier",
        p_entity_id: data.id,
        p_new: { name: kayit.name },
      });
      router.push(`/panel/tedarikciler/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Tedarikçi adı *
        </label>
        <input
          type="text"
          required
          autoFocus
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Örn: ABC Bilgisayar Toptan"
          className={alanSinifi}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Para birimi
          </label>
          <select
            value={paraBirimi}
            onChange={(e) => setParaBirimi(e.target.value)}
            className={alanSinifi}
          >
            <option value="TRY">TL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Telefon
          </label>
          <input
            type="text"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="0212 xxx xx xx"
            className={alanSinifi}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">IBAN</label>
        <input
          type="text"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="TR.. .... .... .... .... .... .."
          className={`${alanSinifi} font-mono`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Adres</label>
        <input
          type="text"
          value={adres}
          onChange={(e) => setAdres(e.target.value)}
          className={alanSinifi}
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={mukellef}
          onChange={(e) => setMukellef(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0 focus:ring-offset-0"
        />
        <span>
          Vergi mükellefi (işletme)
          <span className="block text-xs text-slate-500">
            İşaretsiz bırakırsanız bu tedarikçi vergi mükellefi olmayan bir şahıs sayılır —
            alımlarında fatura yerine gider pusulası düzenlenebilir.
          </span>
        </span>
      </label>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Notlar</label>
        <textarea
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
          rows={3}
          className={alanSinifi}
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
          disabled={yukleniyor || !ad.trim()}
          className="rounded-lg bg-nova-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {yukleniyor ? "Kaydediliyor…" : mevcut ? "Değişiklikleri Kaydet" : "Tedarikçiyi Kaydet"}
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
