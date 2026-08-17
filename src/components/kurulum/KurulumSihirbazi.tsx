"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Adim = 1 | 2 | 3 | 4 | 5 | 6;

const ADIM_ETIKETLERI = [
  "İşletme Bilgileri",
  "Şube",
  "Kasa Hesabı",
  "Ürün Kategorileri",
  "İlk Ürünler",
  "Tamamlandı",
];

const girdiSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500";
const devamSinifi =
  "rounded-lg bg-nova-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-wait disabled:opacity-50";
const geriSinifi =
  "rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500";

type Props = {
  tenantId: string;
  isletmeAdiBaslangic: string;
  telefonBaslangic: string;
  adresBaslangic: string;
  logoBaslangic: string | null;
  subeId: string | null;
  subeAdiBaslangic: string;
  kasaVarMi: boolean;
};

export function KurulumSihirbazi({
  tenantId,
  isletmeAdiBaslangic,
  telefonBaslangic,
  adresBaslangic,
  logoBaslangic,
  subeId,
  subeAdiBaslangic,
  kasaVarMi,
}: Props) {
  const router = useRouter();
  const [adim, setAdim] = useState<Adim>(1);

  // Adım 1 — İşletme bilgileri
  const [isletmeAdi, setIsletmeAdi] = useState(isletmeAdiBaslangic);
  const [telefon, setTelefon] = useState(telefonBaslangic);
  const [adres, setAdres] = useState(adresBaslangic);
  const [logoDosya, setLogoDosya] = useState<File | null>(null);
  const [logoOnizleme, setLogoOnizleme] = useState<string | null>(logoBaslangic);

  // Adım 2 — Şube
  const [subeAdi, setSubeAdi] = useState(subeAdiBaslangic);

  // Adım 3 — Kasa hesabı
  const [kasaVarMiYerel, setKasaVarMiYerel] = useState(kasaVarMi);
  const [kasaAdi, setKasaAdi] = useState("Nakit Kasa");
  const [kasaTipi, setKasaTipi] = useState<"nakit" | "banka" | "pos">("nakit");

  // Adım 4 — Ürün kategorileri
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [yeniKategori, setYeniKategori] = useState("");

  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  function ileriGit() {
    setHata(null);
    setAdim((a) => (a < 6 ? ((a + 1) as Adim) : a));
  }

  function geriGit() {
    setHata(null);
    setAdim((a) => (a > 1 ? ((a - 1) as Adim) : a));
  }

  function logoSec(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0] ?? null;
    setLogoDosya(dosya);
    if (dosya) setLogoOnizleme(URL.createObjectURL(dosya));
  }

  async function isletmeKaydet() {
    if (!isletmeAdi.trim()) {
      setHata("İşletme adı gerekli.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    let logoUrl: string | undefined;

    if (logoDosya) {
      const uzanti = logoDosya.name.split(".").pop() ?? "png";
      const dosyaYolu = `${tenantId}/logo-${Date.now()}.${uzanti}`;
      const { error: yuklemeHatasi } = await supabase.storage
        .from("logolar")
        .upload(dosyaYolu, logoDosya, { upsert: true });
      if (yuklemeHatasi) {
        setYukleniyor(false);
        setHata("Logo yüklenemedi. Dosya 2 MB altı bir görsel olmalı.");
        return;
      }
      const { data } = supabase.storage.from("logolar").getPublicUrl(dosyaYolu);
      logoUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("tenants")
      .update({
        name: isletmeAdi.trim(),
        phone: telefon.trim() || null,
        address: adres.trim() || null,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
      })
      .eq("id", tenantId);

    setYukleniyor(false);
    if (error) {
      setHata("Bilgiler kaydedilemedi. Lütfen tekrar deneyin.");
      return;
    }
    ileriGit();
  }

  async function subeKaydet() {
    if (!subeId) {
      ileriGit();
      return;
    }
    if (!subeAdi.trim()) {
      setHata("Şube adı gerekli.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("branches")
      .update({ name: subeAdi.trim() })
      .eq("id", subeId);
    setYukleniyor(false);
    if (error) {
      setHata("Şube adı kaydedilemedi.");
      return;
    }
    ileriGit();
  }

  async function kasaKaydet() {
    if (kasaVarMiYerel) {
      ileriGit();
      return;
    }
    if (!kasaAdi.trim()) {
      setHata("Kasa hesabı adı gerekli.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("cash_accounts")
      .insert({ tenant_id: tenantId, name: kasaAdi.trim(), type: kasaTipi, created_by: user?.id })
      .select("id")
      .single();
    setYukleniyor(false);
    if (error || !data) {
      setHata("Kasa hesabı oluşturulamadı.");
      return;
    }
    setKasaVarMiYerel(true);
    ileriGit();
  }

  async function kategoriEkle() {
    const ad = yeniKategori.trim();
    if (!ad || kategoriler.includes(ad)) {
      setYeniKategori("");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("product_categories")
      .insert({ tenant_id: tenantId, name: ad });
    if (!error) {
      setKategoriler((k) => [...k, ad]);
      setYeniKategori("");
    }
  }

  async function tamamla() {
    setYukleniyor(true);
    const supabase = createClient();
    await supabase.from("tenants").update({ onboarding_completed: true }).eq("id", tenantId);
    setYukleniyor(false);
    router.push("/panel");
    router.refresh();
  }

  async function sihirbaziAtla() {
    setYukleniyor(true);
    const supabase = createClient();
    await supabase
      .from("tenants")
      .update({ name: isletmeAdi.trim() || undefined, onboarding_completed: true })
      .eq("id", tenantId);
    setYukleniyor(false);
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="glass relative w-full max-w-lg rounded-2xl p-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>
        {adim < 6 && (
          <button
            type="button"
            onClick={sihirbaziAtla}
            disabled={yukleniyor}
            className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-50"
          >
            Şimdilik atla, panele git →
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
        {ADIM_ETIKETLERI.map((etiket, i) => (
          <span
            key={etiket}
            className={`flex items-center gap-1 ${adim === i + 1 ? "font-medium text-nova-300" : ""}`}
          >
            {i > 0 && <span className="text-slate-700">→</span>}
            {i + 1}. {etiket}
          </span>
        ))}
      </div>

      {adim === 1 && (
        <div className="mt-6">
          <h1 className="text-xl font-bold text-white">İşletmenizi tanıyalım</h1>
          <p className="mt-1 text-sm text-slate-400">
            Bu bilgiler servis formlarınızda ve belgelerinizde görünecek.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                İşletme adı *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={isletmeAdi}
                onChange={(e) => setIsletmeAdi(e.target.value)}
                placeholder="Örnek Bilgisayar & Teknik Servis"
                className={girdiSinifi}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Telefon</label>
              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="0 (5xx) xxx xx xx"
                className={girdiSinifi}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Adres</label>
              <textarea
                rows={2}
                value={adres}
                onChange={(e) => setAdres(e.target.value)}
                placeholder="Mahalle, cadde, no, ilçe/il"
                className={`${girdiSinifi} resize-none`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Logo</label>
              <div className="flex items-center gap-4">
                {logoOnizleme ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoOnizleme}
                    alt="Logo önizleme"
                    className="h-14 w-14 rounded-lg border border-slate-700 object-contain"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-700 text-xl text-slate-600">
                    🏪
                  </div>
                )}
                <label className="cursor-pointer rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white">
                  Görsel seç
                  <input type="file" accept="image/*" onChange={logoSec} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {adim === 2 && (
        <div className="mt-6">
          <h1 className="text-xl font-bold text-white">Şubeniz</h1>
          <p className="mt-1 text-sm text-slate-400">
            Şimdilik tek şubeyle başlıyorsunuz — dilerseniz adını değiştirin. Çok şubeli
            işletmeler için destek yol haritamızda.
          </p>
          <div className="mt-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Şube adı</label>
            <input
              type="text"
              autoFocus
              value={subeAdi}
              onChange={(e) => setSubeAdi(e.target.value)}
              placeholder="Merkez"
              className={girdiSinifi}
            />
          </div>
        </div>
      )}

      {adim === 3 && (
        <div className="mt-6">
          <h1 className="text-xl font-bold text-white">Kasa hesabınız</h1>
          <p className="mt-1 text-sm text-slate-400">
            Satış modülünü kullanabilmeniz için en az bir kasa hesabı (nakit, banka veya POS)
            gerekir.
          </p>
          {kasaVarMiYerel ? (
            <div className="mt-6 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              ✓ Zaten bir kasa hesabınız var — bu adımı atlayabilirsiniz. Ayarlar &gt; Finans&apos;tan
              daha fazla ekleyebilirsiniz.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Hesap adı
                </label>
                <input
                  type="text"
                  autoFocus
                  value={kasaAdi}
                  onChange={(e) => setKasaAdi(e.target.value)}
                  placeholder="Örn: Ana Kasa, Garanti POS"
                  className={girdiSinifi}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Tür</label>
                <select
                  value={kasaTipi}
                  onChange={(e) => setKasaTipi(e.target.value as "nakit" | "banka" | "pos")}
                  className={girdiSinifi}
                >
                  <option value="nakit">Nakit</option>
                  <option value="banka">Banka</option>
                  <option value="pos">POS</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {adim === 4 && (
        <div className="mt-6">
          <h1 className="text-xl font-bold text-white">Ürün kategorileri</h1>
          <p className="mt-1 text-sm text-slate-400">
            İsteğe bağlı — ürünlerinizi gruplamak için birkaç kategori ekleyin. Daha sonra
            Stok modülünden de ekleyebilirsiniz.
          </p>
          <div className="mt-6">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={yeniKategori}
                onChange={(e) => setYeniKategori(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    kategoriEkle();
                  }
                }}
                placeholder="Örn: Dizüstü Bilgisayar, Yedek Parça"
                className={girdiSinifi}
              />
              <button
                type="button"
                onClick={kategoriEkle}
                className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-nova-500/50 hover:text-white"
              >
                + Ekle
              </button>
            </div>
            {kategoriler.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {kategoriler.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-nova-500/10 px-3 py-1 text-xs text-nova-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {adim === 5 && (
        <div className="mt-6">
          <h1 className="text-xl font-bold text-white">İlk ürünleriniz</h1>
          <p className="mt-1 text-sm text-slate-400">
            Eski sisteminizden geliyorsanız toplu aktarın, yoksa elle ekleyin — istediğiniz
            zaman Stok modülünden devam edebilirsiniz.
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              href="/panel/import?tur=urun"
              className="glass rounded-xl p-4 transition hover:border-nova-500/40"
            >
              <span className="font-medium text-white">📥 Excel&apos;den İçe Aktar</span>
              <p className="mt-1 text-xs text-slate-400">
                Eski programınızdan veya Excel tablonuzdan toplu ürün aktarın.
              </p>
            </Link>
            <Link
              href="/panel/stok/yeni"
              className="glass rounded-xl p-4 transition hover:border-nova-500/40"
            >
              <span className="font-medium text-white">✏️ Elle Ekle</span>
              <p className="mt-1 text-xs text-slate-400">
                Az sayıda ürününüz varsa tek tek eklemeniz daha hızlı olabilir.
              </p>
            </Link>
          </div>
        </div>
      )}

      {adim === 6 && (
        <div className="mt-6 text-center">
          <span className="text-4xl">🎉</span>
          <h1 className="mt-3 text-xl font-bold text-white">
            {isletmeAdi || "İşletmeniz"} kurulum için hazır!
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            İşte hızlı başlamanız için birkaç bağlantı — istediğiniz zaman panelden devam
            edebilirsiniz.
          </p>
          <div className="mt-6 grid gap-2.5 text-left">
            <Link
              href="/panel/musteriler/yeni"
              className="glass rounded-lg px-4 py-2.5 text-sm text-slate-200 transition hover:border-nova-500/40"
            >
              👥 İlk müşterinizi ekleyin
            </Link>
            <Link
              href="/panel/satis"
              className="glass rounded-lg px-4 py-2.5 text-sm text-slate-200 transition hover:border-nova-500/40"
            >
              🧾 İlk satışınızı yapın
            </Link>
            <Link
              href="/panel/ayarlar#kullanicilar"
              className="glass rounded-lg px-4 py-2.5 text-sm text-slate-200 transition hover:border-nova-500/40"
            >
              ✉️ Ekip arkadaşlarınızı davet edin
            </Link>
            <Link
              href="/panel/kilavuz"
              className="glass rounded-lg px-4 py-2.5 text-sm text-slate-200 transition hover:border-nova-500/40"
            >
              ❓ Kullanım kılavuzuna göz atın
            </Link>
          </div>
        </div>
      )}

      {hata && (
        <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {hata}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        {adim > 1 && adim < 6 ? (
          <button type="button" onClick={geriGit} className={geriSinifi}>
            ← Geri
          </button>
        ) : (
          <span />
        )}
        {adim === 1 && (
          <button type="button" onClick={isletmeKaydet} disabled={yukleniyor || !isletmeAdi.trim()} className={devamSinifi}>
            {yukleniyor ? "Kaydediliyor…" : "Devam Et →"}
          </button>
        )}
        {adim === 2 && (
          <button type="button" onClick={subeKaydet} disabled={yukleniyor} className={devamSinifi}>
            {yukleniyor ? "Kaydediliyor…" : "Devam Et →"}
          </button>
        )}
        {adim === 3 && (
          <button type="button" onClick={kasaKaydet} disabled={yukleniyor} className={devamSinifi}>
            {yukleniyor ? "Kaydediliyor…" : kasaVarMiYerel ? "Devam Et →" : "Kaydet ve Devam Et →"}
          </button>
        )}
        {adim === 4 && (
          <button type="button" onClick={ileriGit} className={devamSinifi}>
            Devam Et →
          </button>
        )}
        {adim === 5 && (
          <button type="button" onClick={ileriGit} className={devamSinifi}>
            Devam Et →
          </button>
        )}
        {adim === 6 && (
          <button type="button" onClick={tamamla} disabled={yukleniyor} className={`${devamSinifi} ml-auto`}>
            {yukleniyor ? "Yönlendiriliyor…" : "Panele Git →"}
          </button>
        )}
      </div>
    </div>
  );
}
