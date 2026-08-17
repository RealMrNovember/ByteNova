"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MusteriSec } from "@/components/cihaz/MusteriSec";
import { BILDIRIM_SABLONLARI, KANAL_ADLARI, type BildirimKanal } from "@/lib/bildirim";

type Musteri = { id: string; name: string; phone: string | null };

export function BildirimGonder({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [musteri, setMusteri] = useState<Musteri | null>(null);
  const [pazarlamaOnayi, setPazarlamaOnayi] = useState<boolean | null>(null);
  const [kanal, setKanal] = useState<BildirimKanal>("whatsapp");
  const [sablonKey, setSablonKey] = useState(BILDIRIM_SABLONLARI[3].key); // serbest_metin
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);

  useEffect(() => {
    if (!musteri) {
      setPazarlamaOnayi(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("customers")
      .select("marketing_consent")
      .eq("id", musteri.id)
      .single()
      .then(({ data }) => setPazarlamaOnayi(data?.marketing_consent ?? false));
  }, [musteri]);

  const secilenSablon = BILDIRIM_SABLONLARI.find((s) => s.key === sablonKey)!;
  const serbestMetin = secilenSablon.key === "serbest_metin" || secilenSablon.key === "kampanya";

  async function gonder() {
    if (!musteri) {
      setHata("Bir müşteri seçin.");
      return;
    }
    if (!musteri.phone) {
      setHata("Seçili müşterinin telefon numarası yok.");
      return;
    }
    if (secilenSablon.tip === "pazarlama" && !pazarlamaOnayi) {
      setHata("Bu müşteri pazarlama mesajı onayı vermemiş (İYS) — kampanya mesajı gönderilemez.");
      return;
    }
    const metin = serbestMetin
      ? mesaj.trim()
      : secilenSablon.metinOlustur({ musteriAdi: musteri.name });
    if (!metin) {
      setHata("Mesaj metni boş olamaz.");
      return;
    }

    setHata(null);
    setBasari(null);
    setGonderiliyor(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("bildirim_gonder", {
      p_customer_id: musteri.id,
      p_channel: kanal,
      p_template_key: secilenSablon.key,
      p_template_type: secilenSablon.tip,
      p_mesaj: metin,
    });
    setGonderiliyor(false);

    if (error) {
      if (error.message.includes("EKLENTI_GEREKLI")) {
        setHata("WhatsApp/SMS Paketi aktif değil — Ayarlar > Eklentiler'den etkinleştirin.");
      } else if (error.message.includes("IYS_ONAY_GEREKLI")) {
        setHata("Bu müşteri pazarlama mesajı onayı vermemiş (İYS).");
      } else {
        setHata("Bildirim gönderilemedi.");
      }
      return;
    }

    setBasari(`${musteri.name} adlı müşteriye ${KANAL_ADLARI[kanal]} üzerinden gönderildi.`);
    setMesaj("");
    router.refresh();
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Bildirim Gönder</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Müşteri</label>
          <MusteriSec tenantId={tenantId} secili={musteri} onSec={setMusteri} />
          {musteri && pazarlamaOnayi === false && (
            <p className="mt-1.5 text-[11px] text-amber-400">
              ⚠️ Bu müşteri pazarlama mesajı onayı vermemiş — yalnızca işlemsel şablonlar gönderilebilir.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Kanal</label>
            <select
              value={kanal}
              onChange={(e) => setKanal(e.target.value as BildirimKanal)}
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            >
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="sms">✉️ SMS</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Şablon</label>
            <select
              value={sablonKey}
              onChange={(e) => setSablonKey(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            >
              {BILDIRIM_SABLONLARI.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.ad} {s.tip === "pazarlama" ? "(pazarlama)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {serbestMetin ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Mesaj</label>
            <textarea
              rows={3}
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Mesajınızı yazın…"
              className="w-full resize-none rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
            />
          </div>
        ) : (
          musteri && (
            <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3 text-xs text-slate-400">
              {secilenSablon.metinOlustur({ musteriAdi: musteri.name })}
            </div>
          )
        )}

        {hata && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {hata}
          </div>
        )}
        {basari && (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            ✓ {basari}
          </div>
        )}

        <button
          type="button"
          onClick={gonder}
          disabled={gonderiliyor || !musteri}
          className="rounded-lg bg-nova-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gonderiliyor ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>
    </div>
  );
}
