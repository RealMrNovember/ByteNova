import { XMLParser } from "fast-xml-parser";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ParaBirimi = {
  code: string;
  name: string;
  symbol: string;
  sort_order: number;
};

export type DovizKuru = {
  currency_code: string;
  rate_to_try: number;
  source: "tcmb" | "manual";
  updated_at: string;
};

// ByteNova'nın takip ettiği yabancı para birimleri (TRY hariç — taban para birimi)
export const TAKIP_EDILEN_KURLAR = ["USD", "EUR", "GBP"];

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

/**
 * TCMB'nin günlük döviz kuru XML akışını çeker ve ayrıştırır.
 * "Döviz Satış" (ForexSelling) kuru kullanılır — bir işletmenin yabancı
 * para tedarik etmek için ödeyeceği kura en yakın referans budur.
 * TCMB hafta sonu/resmi tatilde yayın yapmaz; bu durumda son bilinen kur
 * korunmalı, fonksiyon hata fırlatmamalı (çağıran taraf try/catch ile sarmalı).
 */
export async function tcmbKurlariniCek(): Promise<
  { code: string; rate: number }[]
> {
  const yanit = await fetch(TCMB_URL, {
    // TCMB istemci kimliği kontrolü yapabiliyor; tarayıcı benzeri UA gönderelim
    headers: { "User-Agent": "Mozilla/5.0 (ByteNova kur servisi)" },
    cache: "no-store",
  });

  if (!yanit.ok) {
    throw new Error(`TCMB kur akışı alınamadı: HTTP ${yanit.status}`);
  }

  const xml = await yanit.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const veri = parser.parse(xml);

  const satirlar = veri?.Tarih_Date?.Currency;
  const liste = Array.isArray(satirlar) ? satirlar : satirlar ? [satirlar] : [];

  const sonuc: { code: string; rate: number }[] = [];
  for (const satir of liste) {
    const kod = satir?.["@_Kod"] as string | undefined;
    if (!kod || !TAKIP_EDILEN_KURLAR.includes(kod)) continue;

    const satis = Number(satir?.ForexSelling);
    const birim = Number(satir?.Unit) || 1;
    if (!satis || satis <= 0) continue;

    sonuc.push({ code: kod, rate: satis / birim });
  }

  return sonuc;
}

/** Bir tenant için etkin kur haritasını döner: tenant override > global TCMB. */
export async function etkinKurlar(
  supabase: SupabaseClient
): Promise<Map<string, DovizKuru>> {
  const { data } = await supabase
    .from("exchange_rates")
    .select("currency_code, tenant_id, rate_to_try, source, updated_at");

  const global = new Map<string, DovizKuru>();
  const tenantOzel = new Map<string, DovizKuru>();

  for (const r of data ?? []) {
    const kayit: DovizKuru = {
      currency_code: r.currency_code,
      rate_to_try: Number(r.rate_to_try),
      source: r.source,
      updated_at: r.updated_at,
    };
    if (r.tenant_id === null) global.set(r.currency_code, kayit);
    else tenantOzel.set(r.currency_code, kayit);
  }

  const sonuc = new Map<string, DovizKuru>();
  for (const kod of [...global.keys(), ...tenantOzel.keys()]) {
    sonuc.set(kod, tenantOzel.get(kod) ?? global.get(kod)!);
  }
  return sonuc;
}

/** TL fiyatını en yakın tam liraya yukarı yuvarlar (perakende alışkanlığı). */
export function yukariYuvarla(tutar: number): number {
  return Math.ceil(tutar);
}

/**
 * Dövizli maliyetten satış fiyatı önerisi hesaplar:
 * satış = maliyet(döviz) × kur × (1 + marj/100), yukarı yuvarlanmış.
 */
export function fiyatHesapla(
  maliyet: number,
  kur: number,
  marjYuzde: number
): number {
  return yukariYuvarla(maliyet * kur * (1 + marjYuzde / 100));
}

export function paraFormatla(tutar: number, sembol = "₺"): string {
  return `${sembol}${tutar.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

/** Ürün formları için: para birimi kataloğu + tenant'ın etkin kurları (basit obje). */
export async function urunFormuIcinDovizVerisi(supabase: SupabaseClient) {
  const [{ data: paraBirimleri }, kurHaritasi] = await Promise.all([
    supabase
      .from("currencies")
      .select("code, symbol")
      .in("code", TAKIP_EDILEN_KURLAR)
      .order("sort_order"),
    etkinKurlar(supabase),
  ]);

  const kurlar: Record<string, number> = {};
  for (const [kod, veri] of kurHaritasi) kurlar[kod] = veri.rate_to_try;

  return { paraBirimleri: paraBirimleri ?? [], kurlar };
}
