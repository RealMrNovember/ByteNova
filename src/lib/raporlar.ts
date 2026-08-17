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

// ---------- KÂRLILIK ----------
// Yalnızca Satış (POS) modülünden gelen ürün kalemlerini kapsar — servis
// gelirleri (final_cost) ayrı bir konudur, bu rapora dahil değildir.
//
// İki maliyet yöntemi seçilebilir:
//  - "satis_anindaki": sale_items.unit_cost (Gün 27'de eklenen anlık
//    görüntü) — tarihsel olarak doğru, ama bu alan eklenmeden ÖNCEki
//    satışlarda null'dur (o kalemler kâr hesabına katılmaz, ayrıca sayılır).
//  - "guncel": products.purchase_price bugünkü kurla — "bugünün
//    maliyetiyle satsaydım" senaryosu, geçmişi bugüne göre yeniden fiyatlar.
// Tutarlar KDV DAHİL tutulur (satış fiyatları zaten KDV dahil saklanıyor;
// gerçek net kâr için KDV oranınızı ayrıca düşünmeniz gerekir).

export type KarlilikYontemi = "satis_anindaki" | "guncel";

export type KarlilikKalemi = {
  product_id: string | null;
  name: string;
  quantity: number;
  line_total: number;
  unit_cost: number | null; // satış anındaki TL maliyeti (Gün 27 öncesi satışlarda null)
};

export type KarlilikRaporu = {
  toplamCiro: number;
  toplamMaliyet: number;
  toplamKar: number;
  karMarji: number; // %
  veriEksikKalemSayisi: number;
  urunBazli: { ad: string; adet: number; ciro: number; maliyet: number; kar: number; karMarji: number }[];
};

export function karlilikRaporuHesapla(
  kalemler: KarlilikKalemi[],
  guncelMaliyetTLHaritasi: Map<string, number>,
  yontem: KarlilikYontemi
): KarlilikRaporu {
  let toplamCiro = 0;
  let toplamMaliyet = 0;
  let veriEksikKalemSayisi = 0;
  const urunMap = new Map<string, { adet: number; ciro: number; maliyet: number }>();

  for (const k of kalemler) {
    toplamCiro += k.line_total;

    let birimMaliyet: number | null = null;
    if (k.product_id) {
      if (yontem === "guncel") {
        birimMaliyet = guncelMaliyetTLHaritasi.get(k.product_id) ?? k.unit_cost;
      } else {
        birimMaliyet = k.unit_cost ?? guncelMaliyetTLHaritasi.get(k.product_id) ?? null;
      }
    } else {
      birimMaliyet = 0; // işçilik/hizmet — malzeme maliyeti yok, tamamı kâr
    }

    if (birimMaliyet == null) {
      veriEksikKalemSayisi += 1;
      continue; // maliyeti bilinmeyen kalem toplam kâra karıştırılmaz
    }

    const maliyet = birimMaliyet * k.quantity;
    toplamMaliyet += maliyet;

    const kayit = urunMap.get(k.name) ?? { adet: 0, ciro: 0, maliyet: 0 };
    kayit.adet += k.quantity;
    kayit.ciro += k.line_total;
    kayit.maliyet += maliyet;
    urunMap.set(k.name, kayit);
  }

  const toplamKar = toplamCiro - toplamMaliyet;

  return {
    toplamCiro,
    toplamMaliyet,
    toplamKar,
    karMarji: toplamCiro > 0 ? (toplamKar / toplamCiro) * 100 : 0,
    veriEksikKalemSayisi,
    urunBazli: Array.from(urunMap.entries())
      .map(([ad, v]) => ({
        ad,
        adet: v.adet,
        ciro: v.ciro,
        maliyet: v.maliyet,
        kar: v.ciro - v.maliyet,
        karMarji: v.ciro > 0 ? ((v.ciro - v.maliyet) / v.ciro) * 100 : 0,
      }))
      .sort((a, b) => b.kar - a.kar),
  };
}

// ---------- STOK DEĞERİ ----------

export type StokUrunu = {
  id: string;
  name: string;
  stock_quantity: number;
  purchase_price: number | null;
  purchase_currency: string;
  sale_price: number | null;
  category_name: string | null;
};

export type StokRaporu = {
  toplamMaliyetDegeri: number;
  toplamSatisDegeri: number;
  kategoriBazli: { ad: string; deger: number }[];
};

export function stokRaporuHesapla(
  urunler: StokUrunu[],
  kurHaritasi: Map<string, number>
): StokRaporu {
  let toplamMaliyetDegeri = 0;
  let toplamSatisDegeri = 0;
  const kategoriMap = new Map<string, number>();

  for (const u of urunler) {
    const kurTL = u.purchase_currency === "TRY" ? 1 : (kurHaritasi.get(u.purchase_currency) ?? 0);
    const maliyetTL = (u.purchase_price ?? 0) * kurTL;
    const deger = maliyetTL * u.stock_quantity;

    toplamMaliyetDegeri += deger;
    toplamSatisDegeri += (u.sale_price ?? 0) * u.stock_quantity;

    const kategori = u.category_name ?? "Kategorisiz";
    kategoriMap.set(kategori, (kategoriMap.get(kategori) ?? 0) + deger);
  }

  return {
    toplamMaliyetDegeri,
    toplamSatisDegeri,
    kategoriBazli: Array.from(kategoriMap.entries())
      .map(([ad, deger]) => ({ ad, deger }))
      .sort((a, b) => b.deger - a.deger),
  };
}
