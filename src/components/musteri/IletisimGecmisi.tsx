"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Olay = {
  id: number;
  kind: string;
  content: string;
  created_at: string;
};

type Props = {
  musteriId: string;
  tenantId: string;
  olaylar: Olay[];
};

const TUR_ETIKETLERI: Record<string, string> = {
  note: "📝 Not",
  call: "📞 Arama",
  sms: "💬 SMS",
  whatsapp: "🟢 WhatsApp",
  email: "✉️ E-posta",
  system: "⚙️ Sistem",
};

export function IletisimGecmisi({ musteriId, tenantId, olaylar: ilk }: Props) {
  const [olaylar, setOlaylar] = useState(ilk);
  const [icerik, setIcerik] = useState("");
  const [tur, setTur] = useState("note");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (!icerik.trim()) return;
    setYukleniyor(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("customer_events")
      .insert({
        tenant_id: tenantId,
        customer_id: musteriId,
        user_id: user?.id,
        kind: tur,
        content: icerik.trim(),
      })
      .select("id, kind, content, created_at")
      .single();

    setYukleniyor(false);
    if (!error && data) {
      setOlaylar((o) => [data, ...o]);
      setIcerik("");
    }
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">İletişim Geçmişi</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        &quot;Ben size söylemiştim&quot; tartışmalarını bitirin — her görüşmeyi
        kaydedin.
      </p>

      <form onSubmit={ekle} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={tur}
          onChange={(e) => setTur(e.target.value)}
          className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-300 outline-none focus:border-nova-500"
        >
          <option value="note">📝 Not</option>
          <option value="call">📞 Arama</option>
          <option value="whatsapp">🟢 WhatsApp</option>
          <option value="sms">💬 SMS</option>
          <option value="email">✉️ E-posta</option>
        </select>
        <input
          type="text"
          value={icerik}
          onChange={(e) => setIcerik(e.target.value)}
          placeholder='Örn: "Fiyat iletildi, düşünecek."'
          className="flex-1 rounded-lg border border-slate-700 bg-surface px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500"
        />
        <button
          type="submit"
          disabled={yukleniyor || !icerik.trim()}
          className="rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ekle
        </button>
      </form>

      {olaylar.length === 0 ? (
        <p className="mt-5 text-center text-xs text-slate-600">
          Henüz kayıt yok.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {olaylar.map((o) => (
            <div
              key={o.id}
              className="rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">
                  {TUR_ETIKETLERI[o.kind] ?? o.kind}
                </span>
                <span className="text-[10px] text-slate-600">
                  {new Date(o.created_at).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{o.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
