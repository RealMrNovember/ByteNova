"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Foto = { id: string; storage_path: string; url?: string };

type Props = {
  servisId: string;
  tenantId: string;
  mevcut: { id: string; storage_path: string }[];
};

export function FotografYukle({ servisId, tenantId, mevcut }: Props) {
  const [fotograflar, setFotograflar] = useState<Foto[]>(mevcut);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    async function urlleriYukle() {
      const supabase = createClient();
      const guncellenmis = await Promise.all(
        mevcut.map(async (f) => {
          const { data } = await supabase.storage
            .from("servis-belgeleri")
            .createSignedUrl(f.storage_path, 3600);
          return { ...f, url: data?.signedUrl };
        })
      );
      setFotograflar(guncellenmis);
    }
    if (mevcut.length > 0) urlleriYukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function dosyalariYukle(e: React.ChangeEvent<HTMLInputElement>) {
    const dosyalar = Array.from(e.target.files ?? []);
    if (dosyalar.length === 0) return;
    setHata(null);
    setYukleniyor(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    for (const dosya of dosyalar) {
      if (dosya.size > 5 * 1024 * 1024) {
        setHata("Her fotoğraf en fazla 5 MB olabilir.");
        continue;
      }
      const uzanti = dosya.name.split(".").pop() ?? "jpg";
      const yol = `${tenantId}/${servisId}/foto/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${uzanti}`;

      const { error: yuklemeHatasi } = await supabase.storage
        .from("servis-belgeleri")
        .upload(yol, dosya, { contentType: dosya.type });

      if (yuklemeHatasi) {
        setHata("Fotoğraf yüklenemedi.");
        continue;
      }

      const { data: kayit } = await supabase
        .from("service_photos")
        .insert({
          tenant_id: tenantId,
          service_order_id: servisId,
          storage_path: yol,
          uploaded_by: user?.id,
        })
        .select("id, storage_path")
        .single();

      if (kayit) {
        const { data: imzali } = await supabase.storage
          .from("servis-belgeleri")
          .createSignedUrl(yol, 3600);
        setFotograflar((f) => [...f, { ...kayit, url: imzali?.signedUrl }]);
      }
    }

    setYukleniyor(false);
    e.target.value = "";
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Cihaz Fotoğrafları
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Fiziksel hasar veya durum tespiti için (çizik, kırık ekran vb.)
          </p>
        </div>
        <label className="cursor-pointer rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white">
          {yukleniyor ? "Yükleniyor…" : "+ Fotoğraf Ekle"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={yukleniyor}
            onChange={dosyalariYukle}
            className="hidden"
          />
        </label>
      </div>

      {hata && <p className="mt-3 text-xs text-red-300">{hata}</p>}

      {fotograflar.length === 0 ? (
        <p className="mt-4 text-center text-xs text-slate-600">
          Henüz fotoğraf yok.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {fotograflar.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-lg border border-slate-800 bg-surface"
            >
              {f.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-600">
                  …
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
