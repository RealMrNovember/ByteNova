import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla, etkinKurlar } from "@/lib/doviz";
import { cihazIkon } from "@/lib/cihaz";
import {
  satisRaporuHesapla,
  servisRaporuHesapla,
  karlilikRaporuHesapla,
  stokRaporuHesapla,
  tarihAraligiBaslangic,
  type TarihAraligi,
  type KarlilikKalemi,
  type KarlilikYontemi,
  type StokUrunu,
} from "@/lib/raporlar";

export const metadata: Metadata = { title: "Raporlar — ByteNova" };

const ARALIK_ETIKET: Record<TarihAraligi, string> = {
  "7": "Son 7 Gün",
  "30": "Son 30 Gün",
  "90": "Son 90 Gün",
  "365": "Son 1 Yıl",
};

function ozetKart(baslik: string, deger: string, ikon: string, alt?: string) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{baslik}</span>
        <span className="text-base">{ikon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-200">{deger}</p>
      {alt && <p className="mt-1 text-[11px] text-slate-600">{alt}</p>}
    </div>
  );
}

function sekmeUrl(sekme: string, aralik: string) {
  return `/panel/raporlar?sekme=${sekme}&aralik=${aralik}`;
}

const SEKMELER = ["satis", "servis", "karlilik", "stok"] as const;
type Sekme = (typeof SEKMELER)[number];

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string; aralik?: string; grup?: string; yontem?: string }>;
}) {
  const { sekme: sekmeParam, aralik: aralikParam, grup: grupParam, yontem: yontemParam } = await searchParams;
  const sekme: Sekme = (SEKMELER as readonly string[]).includes(sekmeParam ?? "")
    ? (sekmeParam as Sekme)
    : "satis";
  const aralik: TarihAraligi = ["7", "30", "90", "365"].includes(aralikParam ?? "")
    ? (aralikParam as TarihAraligi)
    : "30";
  const grup: "gun" | "ay" = grupParam === "ay" ? "ay" : "gun";
  const yontem: KarlilikYontemi = yontemParam === "guncel" ? "guncel" : "satis_anindaki";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  if (!yetkiVar(profil?.role, "rapor_gor")) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Yetkiniz yok</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Raporları görüntüleme yetkisi Sahip, Yönetici ve Muhasebe rollerine tanımlıdır.
        </p>
      </div>
    );
  }

  const baslangic = tarihAraligiBaslangic(aralik);

  const { data: kullanicilar } = await supabase.from("profiles").select("id, full_name");
  const adSozlugu = new Map((kullanicilar ?? []).map((k) => [k.id, k.full_name ?? "İsimsiz"]));
  const isimBul = (id: string | null) => (id ? (adSozlugu.get(id) ?? "Silinmiş kullanıcı") : "Sistem");

  let satisIcerik: React.ReactNode = null;
  let servisIcerik: React.ReactNode = null;
  let karlilikIcerik: React.ReactNode = null;
  let stokIcerik: React.ReactNode = null;

  if (sekme === "satis") {
    const { data: satislar } = await supabase
      .from("sales")
      .select("id, created_at, total_amount, discount_amount, subtotal, created_by")
      .gte("created_at", baslangic);

    const satisIdleri = (satislar ?? []).map((s) => s.id);
    const { data: kalemler } = satisIdleri.length
      ? await supabase
          .from("sale_items")
          .select("sale_id, product_id, name, quantity, line_total, discount_amount")
          .in("sale_id", satisIdleri)
      : { data: [] };

    const rapor = satisRaporuHesapla(satislar ?? [], kalemler ?? [], isimBul, grup);

    satisIcerik = (
      <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ozetKart("Toplam Satış", paraFormatla(rapor.toplamSatis), "🧾", `${rapor.toplamAdet} satış`)}
          {ozetKart("Ortalama Sepet", paraFormatla(rapor.ortalamaSepet), "🛒")}
          {ozetKart("Toplam İskonto", paraFormatla(rapor.toplamIskonto), "🏷️")}
          {ozetKart(
            "Satış Adedi",
            String(rapor.toplamAdet),
            "🔢",
            ARALIK_ETIKET[aralik]
          )}
        </div>

        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              {grup === "gun" ? "Günlük" : "Aylık"} Satış Serisi
            </h2>
            <div className="flex gap-1.5 text-[11px]">
              <Link
                href={`/panel/raporlar?sekme=satis&aralik=${aralik}&grup=gun`}
                className={`rounded-lg px-2.5 py-1 ${grup === "gun" ? "bg-nova-500/15 text-nova-300" : "text-slate-500 hover:text-slate-300"}`}
              >
                Gün
              </Link>
              <Link
                href={`/panel/raporlar?sekme=satis&aralik=${aralik}&grup=ay`}
                className={`rounded-lg px-2.5 py-1 ${grup === "ay" ? "bg-nova-500/15 text-nova-300" : "text-slate-500 hover:text-slate-300"}`}
              >
                Ay
              </Link>
            </div>
          </div>
          {!rapor.seri.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">Bu aralıkta satış yok.</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {rapor.seri.map((s) => (
                <div key={s.anahtar} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-300">{s.anahtar}</span>
                  <span className="text-slate-500">{s.adet} satış</span>
                  <span className="font-semibold text-slate-200">{paraFormatla(s.toplam)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass overflow-hidden rounded-xl">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">En Çok Satan Ürünler</h2>
            </div>
            {!rapor.urunBazli.length ? (
              <p className="px-4 py-8 text-center text-xs text-slate-600">Veri yok.</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {rapor.urunBazli.map((u, i) => (
                  <div key={u.ad} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-5 shrink-0 text-xs text-slate-600">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-200">{u.ad}</span>
                    <span className="shrink-0 text-xs text-slate-500">{u.adet} adet</span>
                    <span className="shrink-0 font-semibold text-slate-200">{paraFormatla(u.toplam)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass overflow-hidden rounded-xl">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Personel Performansı</h2>
            </div>
            {!rapor.personelBazli.length ? (
              <p className="px-4 py-8 text-center text-xs text-slate-600">Veri yok.</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {rapor.personelBazli.map((p) => (
                  <div key={p.ad} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate text-slate-200">{p.ad}</span>
                    <span className="shrink-0 text-xs text-slate-500">{p.adet} satış</span>
                    <span className="shrink-0 text-xs text-amber-300">%{p.iskontoOrani.toFixed(1)} iskonto</span>
                    <span className="shrink-0 font-semibold text-slate-200">{paraFormatla(p.toplam)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  } else if (sekme === "servis") {
    const { data: servisler } = await supabase
      .from("service_orders")
      .select("id, created_at, delivered_at, technician_id, device_id")
      .gte("created_at", baslangic);

    const { data: tumServisCihazlari } = await supabase
      .from("service_orders")
      .select("device_id")
      .not("device_id", "is", null);

    const cihazSayaci = new Map<string, number>();
    for (const s of tumServisCihazlari ?? []) {
      if (!s.device_id) continue;
      cihazSayaci.set(s.device_id, (cihazSayaci.get(s.device_id) ?? 0) + 1);
    }

    const rapor = servisRaporuHesapla(servisler ?? [], isimBul, cihazSayaci);

    const tekrarEdenCihazIdleri = rapor.tekrarEdenler.map((t) => t.deviceId);
    const { data: cihazDetaylari } = tekrarEdenCihazIdleri.length
      ? await supabase
          .from("devices")
          .select("id, device_type, brand, model, customers(name)")
          .in("id", tekrarEdenCihazIdleri)
      : { data: [] };
    const cihazSozlugu = new Map(
      (cihazDetaylari ?? []).map((c) => [
        c.id,
        {
          ad: [c.brand, c.model].filter(Boolean).join(" ") || "İsimsiz cihaz",
          ikon: cihazIkon(c.device_type),
          musteri: (c.customers as unknown as { name: string } | null)?.name ?? "—",
        },
      ])
    );

    servisIcerik = (
      <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {ozetKart("Toplam Servis", String(rapor.toplamServis), "🔧", ARALIK_ETIKET[aralik])}
          {ozetKart(
            "Ortalama Süre",
            rapor.ortalamaSureGun != null ? `${rapor.ortalamaSureGun.toFixed(1)} gün` : "—",
            "⏱️",
            "Kabulden teslime"
          )}
          {ozetKart("Tekrar Eden Cihaz", String(rapor.tekrarEdenler.length), "🔁", "Tüm zamanlar, 1'den fazla servis")}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass overflow-hidden rounded-xl">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Teknisyen Performansı</h2>
            </div>
            {!rapor.teknisyenBazli.length ? (
              <p className="px-4 py-8 text-center text-xs text-slate-600">Veri yok.</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {rapor.teknisyenBazli.map((t) => (
                  <div key={t.ad} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate text-slate-200">{t.ad}</span>
                    <span className="shrink-0 text-xs text-slate-500">{t.adet} servis</span>
                    <span className="shrink-0 font-semibold text-slate-200">
                      {t.ortalamaSureGun != null ? `${t.ortalamaSureGun.toFixed(1)} gün ort.` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass overflow-hidden rounded-xl">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Tekrar Eden Cihazlar</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Aynı cihaz birden fazla kez servise girmişse</p>
            </div>
            {!rapor.tekrarEdenler.length ? (
              <p className="px-4 py-8 text-center text-xs text-slate-600">Tekrar eden cihaz yok.</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {rapor.tekrarEdenler.map((t) => {
                  const cihaz = cihazSozlugu.get(t.deviceId);
                  return (
                    <Link
                      key={t.deviceId}
                      href={`/panel/cihazlar/${t.deviceId}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-800/30"
                    >
                      <span>{cihaz?.ikon ?? "💻"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-slate-200">{cihaz?.ad ?? "Silinmiş cihaz"}</p>
                        <p className="truncate text-[11px] text-slate-500">{cihaz?.musteri}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                        {t.adet}× servis
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  } else if (sekme === "karlilik") {
    const { data: satislar } = await supabase
      .from("sales")
      .select("id, created_at")
      .gte("created_at", baslangic);

    const satisIdleri = (satislar ?? []).map((s) => s.id);
    const { data: kalemlerHam } = satisIdleri.length
      ? await supabase
          .from("sale_items")
          .select("product_id, name, quantity, line_total, unit_cost")
          .in("sale_id", satisIdleri)
      : { data: [] };
    const kalemler: KarlilikKalemi[] = kalemlerHam ?? [];

    const urunIdleri = Array.from(new Set(kalemler.map((k) => k.product_id).filter((id): id is string => !!id)));
    const { data: urunMaliyetleri } = urunIdleri.length
      ? await supabase.from("products").select("id, purchase_price, purchase_currency").in("id", urunIdleri)
      : { data: [] };
    const kurHaritasi = await etkinKurlar(supabase);

    const guncelMaliyetTLHaritasi = new Map<string, number>();
    for (const u of urunMaliyetleri ?? []) {
      if (u.purchase_price == null) continue;
      const kur = u.purchase_currency === "TRY" ? 1 : kurHaritasi.get(u.purchase_currency)?.rate_to_try;
      if (kur == null) continue;
      guncelMaliyetTLHaritasi.set(u.id, u.purchase_price * kur);
    }

    const rapor = karlilikRaporuHesapla(kalemler, guncelMaliyetTLHaritasi, yontem);

    karlilikIcerik = (
      <>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/panel/raporlar?sekme=karlilik&aralik=${aralik}&yontem=satis_anindaki`}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              yontem === "satis_anindaki"
                ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            Satış Anındaki Maliyet
          </Link>
          <Link
            href={`/panel/raporlar?sekme=karlilik&aralik=${aralik}&yontem=guncel`}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              yontem === "guncel"
                ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            Güncel Maliyet
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ozetKart("Toplam Ciro", paraFormatla(rapor.toplamCiro), "🧾")}
          {ozetKart("Toplam Maliyet", paraFormatla(rapor.toplamMaliyet), "📦")}
          {ozetKart("Toplam Kâr", paraFormatla(rapor.toplamKar), "💰")}
          {ozetKart("Kâr Marjı", `%${rapor.karMarji.toFixed(1)}`, "📈")}
        </div>

        {rapor.veriEksikKalemSayisi > 0 && (
          <p className="mt-3 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-300">
            ⚠️ {rapor.veriEksikKalemSayisi} kalemde maliyet verisi bulunamadı (ürün silinmiş veya kur tanımsız) — bu
            kalemler kâr hesabına dahil edilmedi.
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-600">
          Tutarlar KDV dahildir. Yalnızca Satış (POS) modülü kapsar — servis geliri dahil değildir.
          {yontem === "satis_anindaki" && " Bu migration'dan (17 Ağu 2026) önceki satışlarda anlık maliyet kaydı yoktur."}
        </p>

        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Ürün Bazlı Kârlılık</h2>
          </div>
          {!rapor.urunBazli.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">Bu aralıkta veri yok.</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {rapor.urunBazli.map((u) => (
                <div key={u.ad} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-slate-200">{u.ad}</span>
                  <span className="shrink-0 text-xs text-slate-500">{u.adet} adet</span>
                  <span className="shrink-0 text-xs text-slate-400">{paraFormatla(u.ciro)} ciro</span>
                  <span className="shrink-0 text-xs text-emerald-400">%{u.karMarji.toFixed(1)}</span>
                  <span className="shrink-0 w-20 text-right font-semibold text-slate-200">{paraFormatla(u.kar)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  } else if (sekme === "stok") {
    const { data: stokUrunleriHam } = await supabase
      .from("products")
      .select("id, name, stock_quantity, purchase_price, purchase_currency, sale_price, product_categories(name)")
      .eq("is_active", true);

    const kurHaritasi = await etkinKurlar(supabase);
    const kurBasit = new Map<string, number>();
    for (const [kod, v] of kurHaritasi) kurBasit.set(kod, v.rate_to_try);

    const stokUrunleri: StokUrunu[] = (stokUrunleriHam ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      stock_quantity: u.stock_quantity,
      purchase_price: u.purchase_price,
      purchase_currency: u.purchase_currency,
      sale_price: u.sale_price,
      category_name: (u.product_categories as unknown as { name: string } | null)?.name ?? null,
    }));

    const rapor = stokRaporuHesapla(stokUrunleri, kurBasit);

    stokIcerik = (
      <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
          {ozetKart("Toplam Maliyet Değeri", paraFormatla(rapor.toplamMaliyetDegeri), "📦", "Güncel raf maliyeti")}
          {ozetKart("Toplam Satış Değeri", paraFormatla(rapor.toplamSatisDegeri), "🏷️", "Güncel satış fiyatlarıyla")}
        </div>
        <p className="mt-2 text-[11px] text-slate-600">Anlık stok görüntüsüdür — tarih aralığı seçimi bu sekmeyi etkilemez.</p>

        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Kategori Bazlı Stok Değeri</h2>
          </div>
          {!rapor.kategoriBazli.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">Aktif ürün yok.</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {rapor.kategoriBazli.map((k) => (
                <div key={k.ad} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-300">{k.ad}</span>
                  <span className="font-semibold text-slate-200">{paraFormatla(k.deger)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  const buAy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }).slice(0, 7);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Raporlar</h1>
          <p className="mt-0.5 text-sm text-slate-400">Satış, servis, kârlılık ve stok performansı</p>
        </div>
        <form
          method="GET"
          action="/api/raporlar/muhasebeci-paketi"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2 py-1.5"
        >
          <input
            type="month"
            name="ay"
            defaultValue={buAy}
            required
            className="rounded-md border-0 bg-transparent text-[11px] text-slate-300 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-nova-500/15 px-2.5 py-1 text-[11px] font-medium text-nova-300 hover:bg-nova-500/25"
          >
            📥 Muhasebeci Paketi (Excel)
          </button>
        </form>
      </div>

      {/* Aralık seçici — link seti (JS gerektirmez); Stok anlık görüntü olduğu için gizli */}
      {sekme !== "stok" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(ARALIK_ETIKET) as TarihAraligi[]).map((a) => (
            <Link
              key={a}
              href={sekmeUrl(sekme, a)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                aralik === a
                  ? "border-nova-500/60 bg-nova-500/10 text-nova-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {ARALIK_ETIKET[a]}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2 border-b border-slate-800">
        <Link
          href={sekmeUrl("satis", aralik)}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            sekme === "satis" ? "border-nova-400 text-nova-300" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          🧾 Satış
        </Link>
        <Link
          href={sekmeUrl("servis", aralik)}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            sekme === "servis" ? "border-nova-400 text-nova-300" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          🔧 Servis
        </Link>
        <Link
          href={sekmeUrl("karlilik", aralik)}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            sekme === "karlilik" ? "border-nova-400 text-nova-300" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          💰 Kârlılık
        </Link>
        <Link
          href={sekmeUrl("stok", aralik)}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            sekme === "stok" ? "border-nova-400 text-nova-300" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          📦 Stok
        </Link>
      </div>

      <div className="mt-5">
        {sekme === "satis" && satisIcerik}
        {sekme === "servis" && servisIcerik}
        {sekme === "karlilik" && karlilikIcerik}
        {sekme === "stok" && stokIcerik}
      </div>
    </div>
  );
}
