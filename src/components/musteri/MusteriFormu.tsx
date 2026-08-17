"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { vknGecerliMi } from "@/lib/e-belge";

type Mevcut = {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  address: string | null;
  tax_office: string | null;
  tax_number: string | null;
  notes: string | null;
  marketing_consent: boolean;
};

type Props = {
  tenantId: string;
  mevcut?: Mevcut; // doluysa düzenleme modu
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";

export function MusteriFormu({ tenantId, mevcut }: Props) {
  const router = useRouter();
  const [tip, setTip] = useState(mevcut?.type ?? "individual");
  const [ad, setAd] = useState(mevcut?.name ?? "");
  const [telefon, setTelefon] = useState(mevcut?.phone ?? "");
  const [telefon2, setTelefon2] = useState(mevcut?.phone2 ?? "");
  const [email, setEmail] = useState(mevcut?.email ?? "");
  const [adres, setAdres] = useState(mevcut?.address ?? "");
  const [vergiDairesi, setVergiDairesi] = useState(mevcut?.tax_office ?? "");
  const [vergiNo, setVergiNo] = useState(mevcut?.tax_number ?? "");
  const [not, setNot] = useState(mevcut?.notes ?? "");
  const [pazarlamaOnayi, setPazarlamaOnayi] = useState(mevcut?.marketing_consent ?? false);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);

    if (vergiNo.trim() && !vknGecerliMi(vergiNo)) {
      setHata("Vergi no / TCKN 10 (VKN) veya 11 (TCKN) haneli sayısal olmalı.");
      return;
    }

    setYukleniyor(true);

    const supabase = createClient();
    const kayit = {
      type: tip,
      name: ad.trim(),
      phone: telefon.trim() || null,
      phone2: telefon2.trim() || null,
      email: email.trim() || null,
      address: adres.trim() || null,
      tax_office: vergiDairesi.trim() || null,
      tax_number: vergiNo.trim() || null,
      notes: not.trim() || null,
      marketing_consent: pazarlamaOnayi,
      ...(pazarlamaOnayi !== (mevcut?.marketing_consent ?? false)
        ? { marketing_consent_updated_at: new Date().toISOString() }
        : {}),
    };

    if (mevcut) {
      const { error } = await supabase
        .from("customers")
        .update(kayit)
        .eq("id", mevcut.id);
      setYukleniyor(false);
      if (error) {
        setHata("Müşteri güncellenemedi. Lütfen tekrar deneyin.");
        return;
      }
      await supabase.rpc("audit_ekle", {
        p_action: "musteri_guncellendi",
        p_entity: "customer",
        p_entity_id: mevcut.id,
        p_new: { name: kayit.name },
      });
      router.push(`/panel/musteriler/${mevcut.id}`);
      router.refresh();
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...kayit, tenant_id: tenantId, created_by: user?.id })
        .select("id")
        .single();
      setYukleniyor(false);
      if (error || !data) {
        setHata("Müşteri kaydedilemedi. Lütfen tekrar deneyin.");
        return;
      }
      await supabase.rpc("audit_ekle", {
        p_action: "musteri_olusturuldu",
        p_entity: "customer",
        p_entity_id: data.id,
        p_new: { name: kayit.name },
      });
      router.push(`/panel/musteriler/${data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-4">
      {/* Tip seçimi */}
      <div className="flex gap-2">
        {[
          { deger: "individual", etiket: "👤 Bireysel" },
          { deger: "corporate", etiket: "🏢 Kurumsal" },
        ].map((t) => (
          <button
            key={t.deger}
            type="button"
            onClick={() => setTip(t.deger)}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              tip === t.deger
                ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t.etiket}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          {tip === "corporate" ? "Firma unvanı *" : "Ad Soyad *"}
        </label>
        <input
          type="text"
          required
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder={
            tip === "corporate" ? "Örnek Bilişim Ltd. Şti." : "Ad Soyad"
          }
          className={alanSinifi}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Telefon
          </label>
          <input
            type="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="0 (5xx) xxx xx xx"
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            İkinci telefon
          </label>
          <input
            type="tel"
            value={telefon2}
            onChange={(e) => setTelefon2(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            E-posta
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={alanSinifi}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Adres
          </label>
          <input
            type="text"
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
            className={alanSinifi}
          />
        </div>
      </div>

      {tip === "corporate" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Vergi dairesi
            </label>
            <input
              type="text"
              value={vergiDairesi}
              onChange={(e) => setVergiDairesi(e.target.value)}
              className={alanSinifi}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Vergi no / TCKN
            </label>
            <input
              type="text"
              value={vergiNo}
              onChange={(e) => setVergiNo(e.target.value)}
              className={alanSinifi}
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Notlar
        </label>
        <textarea
          rows={2}
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Müşteriyle ilgili özel notlar…"
          className={`${alanSinifi} resize-none`}
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={pazarlamaOnayi}
          onChange={(e) => setPazarlamaOnayi(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0 focus:ring-offset-0"
        />
        <span>
          Pazarlama mesajı onayı (İYS) — müşteri kampanya/duyuru mesajı almayı kabul ediyor.
          <span className="block text-xs text-slate-500">
            Yalnızca gerçek bir rıza varsa işaretleyin; servis/sipariş bildirimleri bu onaya tabi değildir.
          </span>
        </span>
      </label>

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
          {yukleniyor
            ? "Kaydediliyor…"
            : mevcut
              ? "Değişiklikleri Kaydet"
              : "Müşteriyi Kaydet"}
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
