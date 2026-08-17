// Raporlar modülü — saf hesaplama fonksiyonları (Server Component'lerden
// çağrılır, veri erişimi içermez). Küçük/orta işletme ölçeğinde tarih
// aralığı sorgusuyla çekilen satırlar üzerinde JS tarafında agregasyon
// yapılır — cari yaşlandırma raporuyla aynı desen.

export type TarihAraligi = "7" | "30" | "90" | "365";

export function tarihAraligiBaslangic(aralik: TarihAraligi): string {
  const gun = Number(aralik);
  const d = new Date();
  d.setDate(d.getDate() - gun);
  return d.toISOString();
}

/** created_at gibi bir timestamptz'i Türkiye saatine göre YYYY-MM-DD (gün) veya YYYY-MM (ay) anahtarına çevirir. */
export function periyotAnahtari(iso: string, grup: "gun" | "ay"): string {
  const yerelTarih = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD
  return grup === "gun" ? yerelTarih : yerelTarih.slice(0, 7);
}

// ---------- SATIŞ ----------

export type SatisKalemi = {
  sale_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  line_total: number;
  discount_amount: number;
};

export type SatisSatiri = {
  id: string;
  created_at: string;
  total_amount: number;
  discount_amount: number;
  subtotal: number;
  created_by: string | null;
};

export type SatisRaporu = {
  toplamSatis: number;
  toplamAdet: number;
  toplamIskonto: number;
  ortalamaSepet: number;
  seri: { anahtar: string; adet: number; toplam: number }[];
  urunBazli: { ad: string; adet: number; toplam: number }[];
  personelBazli: { ad: string; adet: number; toplam: number; iskontoOrani: number }[];
};

export function satisRaporuHesapla(
  satislar: SatisSatiri[],
  kalemler: SatisKalemi[],
  kullaniciAdi: (id: string | null) => string,
  grup: "gun" | "ay"
): SatisRaporu {
  // Satır iskontoları (sale_items.discount_amount) satış başına toplanır —
  // "Toplam İskonto" yalnızca genel iskontoyu (sales.discount_amount)
  // sayarsa, HizliSatis'te en sık kullanılan satır iskontosu görünmez.
  const satirIskontoMap = new Map<string, number>();
  for (const k of kalemler) {
    satirIskontoMap.set(k.sale_id, (satirIskontoMap.get(k.sale_id) ?? 0) + k.discount_amount);
  }

  const toplamSatis = satislar.reduce((t, s) => t + s.total_amount, 0);
  const toplamIskonto = satislar.reduce(
    (t, s) => t + s.discount_amount + (satirIskontoMap.get(s.id) ?? 0),
    0
  );

  const seriMap = new Map<string, { adet: number; toplam: number }>();
  const personelMap = new Map<string, { adet: number; toplam: number; iskonto: number; indirimsiz: number }>();

  for (const s of satislar) {
    const anahtar = periyotAnahtari(s.created_at, grup);
    const seriKayit = seriMap.get(anahtar) ?? { adet: 0, toplam: 0 };
    seriKayit.adet += 1;
    seriKayit.toplam += s.total_amount;
    seriMap.set(anahtar, seriKayit);

    const satisIskontosu = s.discount_amount + (satirIskontoMap.get(s.id) ?? 0);
    const kisi = kullaniciAdi(s.created_by);
    const pKayit = personelMap.get(kisi) ?? { adet: 0, toplam: 0, iskonto: 0, indirimsiz: 0 };
    pKayit.adet += 1;
    pKayit.toplam += s.total_amount;
    pKayit.iskonto += satisIskontosu;
    pKayit.indirimsiz += s.total_amount + satisIskontosu;
    personelMap.set(kisi, pKayit);
  }

  const urunMap = new Map<string, { adet: number; toplam: number }>();
  for (const k of kalemler) {
    const kayit = urunMap.get(k.name) ?? { adet: 0, toplam: 0 };
    kayit.adet += k.quantity;
    kayit.toplam += k.line_total;
    urunMap.set(k.name, kayit);
  }

  return {
    toplamSatis,
    toplamAdet: satislar.length,
    toplamIskonto,
    ortalamaSepet: satislar.length > 0 ? toplamSatis / satislar.length : 0,
    seri: Array.from(seriMap.entries())
      .map(([anahtar, v]) => ({ anahtar, ...v }))
      .sort((a, b) => a.anahtar.localeCompare(b.anahtar)),
    urunBazli: Array.from(urunMap.entries())
      .map(([ad, v]) => ({ ad, ...v }))
      .sort((a, b) => b.toplam - a.toplam)
      .slice(0, 10),
    personelBazli: Array.from(personelMap.entries())
      .map(([ad, v]) => ({
        ad,
        adet: v.adet,
        toplam: v.toplam,
        iskontoOrani: v.indirimsiz > 0 ? (v.iskonto / v.indirimsiz) * 100 : 0,
      }))
      .sort((a, b) => b.toplam - a.toplam),
  };
}

// ---------- SERVİS ----------

export type ServisSatiri = {
  id: string;
  created_at: string;
  delivered_at: string | null;
  technician_id: string | null;
  device_id: string | null;
};

export type ServisRaporu = {
  toplamServis: number;
  ortalamaSureGun: number | null;
  teknisyenBazli: { ad: string; adet: number; ortalamaSureGun: number | null }[];
  tekrarEdenler: { deviceId: string; adet: number }[];
};

export function servisRaporuHesapla(
  servisler: ServisSatiri[],
  teknisyenAdi: (id: string | null) => string,
  tumZamanlarCihazSayaci: Map<string, number>
): ServisRaporu {
  const sureler: number[] = [];
  const teknisyenMap = new Map<string, { adet: number; sureler: number[] }>();

  for (const s of servisler) {
    let sureGun: number | null = null;
    if (s.delivered_at) {
      sureGun = (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
      sureler.push(sureGun);
    }
    const kisi = teknisyenAdi(s.technician_id);
    const kayit = teknisyenMap.get(kisi) ?? { adet: 0, sureler: [] };
    kayit.adet += 1;
    if (sureGun != null) kayit.sureler.push(sureGun);
    teknisyenMap.set(kisi, kayit);
  }

  const ortalama = (dizi: number[]) => (dizi.length ? dizi.reduce((a, b) => a + b, 0) / dizi.length : null);

  const tekrarEdenler = Array.from(tumZamanlarCihazSayaci.entries())
    .filter(([, adet]) => adet > 1)
    .map(([deviceId, adet]) => ({ deviceId, adet }))
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 10);

  return {
    toplamServis: servisler.length,
    ortalamaSureGun: ortalama(sureler),
    teknisyenBazli: Array.from(teknisyenMap.entries())
      .map(([ad, v]) => ({ ad, adet: v.adet, ortalamaSureGun: ortalama(v.sureler) }))
      .sort((a, b) => b.adet - a.adet),
    tekrarEdenler,
  };
}
