"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function KurulumPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isletmeAdi, setIsletmeAdi] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [logoDosya, setLogoDosya] = useState<File | null>(null);
  const [logoOnizleme, setLogoOnizleme] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    async function yukle() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/giris");
        return;
      }
      const { data: profil } = await supabase
        .from("profiles")
        .select("tenant_id, tenants(*)")
        .eq("id", user.id)
        .single();

      const tenant = profil?.tenants as unknown as {
        name?: string;
        phone?: string;
        address?: string;
        logo_url?: string;
      } | null;

      setTenantId(profil?.tenant_id ?? null);
      if (tenant?.name && tenant.name !== "İşletmem") {
        setIsletmeAdi(tenant.name);
      }
      setTelefon(tenant?.phone ?? "");
      setAdres(tenant?.address ?? "");
      setLogoOnizleme(tenant?.logo_url ?? null);
      setHazir(true);
    }
    yukle();
  }, [router]);

  function logoSec(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0] ?? null;
    setLogoDosya(dosya);
    if (dosya) {
      setLogoOnizleme(URL.createObjectURL(dosya));
    }
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setHata(null);
    setYukleniyor(true);

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
        onboarding_completed: true,
      })
      .eq("id", tenantId);

    setYukleniyor(false);

    if (error) {
      setHata("Bilgiler kaydedilemedi. Lütfen tekrar deneyin.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "isletme_guncellendi",
      p_entity: "tenant",
      p_entity_id: tenantId,
      p_new: { name: isletmeAdi.trim(), phone: telefon.trim() || null },
    });

    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glass relative w-full max-w-lg rounded-2xl p-8">
        <Link href="/" className="text-lg font-semibold text-white">
          ⚡ Byte<span className="text-nova-400">Nova</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold text-white">
          İşletmenizi tanıyalım
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Bu bilgiler servis formlarınızda ve belgelerinizde görünecek.
          Dilerseniz daha sonra Ayarlar&apos;dan güncelleyebilirsiniz.
        </p>

        {!hazir ? (
          <div className="mt-8 space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
            <div className="h-20 animate-pulse rounded-lg bg-slate-800/60" />
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={kaydet}>
            <div>
              <label
                htmlFor="isletme"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                İşletme adı *
              </label>
              <input
                id="isletme"
                type="text"
                required
                value={isletmeAdi}
                onChange={(e) => setIsletmeAdi(e.target.value)}
                placeholder="Örnek Bilgisayar & Teknik Servis"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
              />
            </div>

            <div>
              <label
                htmlFor="telefon"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Telefon
              </label>
              <input
                id="telefon"
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="0 (5xx) xxx xx xx"
                className="w-full rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
              />
            </div>

            <div>
              <label
                htmlFor="adres"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Adres
              </label>
              <textarea
                id="adres"
                rows={2}
                value={adres}
                onChange={(e) => setAdres(e.target.value)}
                placeholder="Mahalle, cadde, no, ilçe/il"
                className="w-full resize-none rounded-lg border border-slate-700 bg-surface px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-nova-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Logo
              </label>
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={logoSec}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {hata && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {hata}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={yukleniyor || !isletmeAdi.trim()}
                className="flex-1 rounded-lg bg-nova-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {yukleniyor ? "Kaydediliyor…" : "Kaydet ve Panele Geç"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
