"use client";

import Link from "next/link";
import { useState } from "react";
import { whatsappIcinBelgeHazirla } from "@/app/panel/servisler/[id]/actions";

type Props = {
  servisId: string;
  publicToken: string;
  teslimEdildiMi: boolean;
  whatsappEklentisiAktif: boolean;
};

const HATA_MESAJLARI: Record<string, string> = {
  eklenti_yok: "WhatsApp & SMS Paketi aktif değil.",
  yukleme_hatasi: "Belge yüklenemedi. Lütfen tekrar deneyin.",
};

export function BelgeIslemleri({
  servisId,
  publicToken,
  teslimEdildiMi,
  whatsappEklentisiAktif,
}: Props) {
  const [gonderiliyor, setGonderiliyor] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const takipUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/servis-takip/${publicToken}`
      : `/servis-takip/${publicToken}`;

  async function takipLinkiKopyala() {
    await navigator.clipboard.writeText(takipUrl);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  async function whatsappIleGonder(tip: "kabul" | "teslim") {
    setHata(null);
    setGonderiliyor(tip);

    // Pop-up engelleyiciye takılmamak için pencereyi kullanıcı tıklamasıyla
    // senkron açıyoruz; PDF hazır olunca yalnızca adresini güncelliyoruz.
    const pencere = window.open("", "_blank");

    const sonuc = await whatsappIcinBelgeHazirla(servisId, tip);
    setGonderiliyor(null);

    if (!sonuc.ok) {
      pencere?.close();
      setHata(HATA_MESAJLARI[sonuc.hata ?? ""] ?? "Bir sorun oluştu.");
      return;
    }

    const belgeAdi = tip === "teslim" ? "teslim tutanağınız" : "servis kabul formunuz";
    const mesaj = encodeURIComponent(
      `Merhaba ${sonuc.musteriAdi}, ${sonuc.servisNo} numaralı servisinize ait ${belgeAdi}: ${sonuc.url}`
    );
    const telefon = sonuc.telefon
      ? "9" + sonuc.telefon.replace(/\D/g, "").replace(/^0/, "")
      : "";
    const hedefUrl = `https://wa.me/${telefon}?text=${mesaj}`;

    if (pencere) pencere.location.href = hedefUrl;
    else window.open(hedefUrl, "_blank");
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Belgeler</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        PDF olarak indirin veya doğrudan müşteriye gönderin.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/api/servis/${servisId}/pdf?tip=kabul&indir=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
        >
          📄 Kabul Formu (PDF)
        </a>
        {teslimEdildiMi && (
          <a
            href={`/api/servis/${servisId}/pdf?tip=teslim&indir=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            📄 Teslim Tutanağı (PDF)
          </a>
        )}

        {whatsappEklentisiAktif ? (
          <>
            <button
              onClick={() => whatsappIleGonder("kabul")}
              disabled={gonderiliyor !== null}
              className="rounded-lg border border-emerald-600/40 px-3.5 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-wait disabled:opacity-60"
            >
              {gonderiliyor === "kabul"
                ? "Hazırlanıyor…"
                : "🟢 Kabul Formunu WhatsApp'tan Gönder"}
            </button>
            {teslimEdildiMi && (
              <button
                onClick={() => whatsappIleGonder("teslim")}
                disabled={gonderiliyor !== null}
                className="rounded-lg border border-emerald-600/40 px-3.5 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-wait disabled:opacity-60"
              >
                {gonderiliyor === "teslim"
                  ? "Hazırlanıyor…"
                  : "🟢 Teslim Tutanağını WhatsApp'tan Gönder"}
              </button>
            )}
          </>
        ) : (
          <Link
            href="/panel/ayarlar#eklentiler"
            className="rounded-lg border border-purple-500/25 bg-purple-500/5 px-3.5 py-2 text-xs font-medium text-purple-300 transition hover:bg-purple-500/10"
          >
            🔒 WhatsApp ile gönderim — Paketi Aktifleştir
          </Link>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
        <a
          href={`/servis-takip/${publicToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-nova-300 hover:text-nova-100"
        >
          🔗 Müşteri Takip Sayfası
        </a>
        <button
          type="button"
          onClick={takipLinkiKopyala}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          {kopyalandi ? "Kopyalandı ✓" : "Bağlantıyı Kopyala"}
        </button>
      </div>

      {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}
    </div>
  );
}
