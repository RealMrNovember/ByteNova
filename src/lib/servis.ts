// Servis modülü sabitleri — tek kaynak.
// DB check constraint'leriyle birebir aynı değerler kullanılır.

export const DURUMLAR = [
  { deger: "kabul_edildi", etiket: "Kabul Edildi", renk: "slate" },
  { deger: "incelemede", etiket: "İncelemede", renk: "sky" },
  { deger: "fiyatlandirma_bekliyor", etiket: "Fiyatlandırma Bekliyor", renk: "amber" },
  { deger: "onay_bekliyor", etiket: "Müşteri Onayı Bekliyor", renk: "amber" },
  { deger: "onaylandi", etiket: "Onaylandı", renk: "nova" },
  { deger: "onariliyor", etiket: "Onarılıyor", renk: "nova" },
  { deger: "test_ediliyor", etiket: "Test Ediliyor", renk: "nova" },
  { deger: "hazir", etiket: "Hazır", renk: "emerald" },
  { deger: "teslim_edildi", etiket: "Teslim Edildi", renk: "emerald" },
  { deger: "parca_bekleniyor", etiket: "Parça Bekleniyor", renk: "amber" },
  { deger: "dis_serviste", etiket: "Dış Serviste", renk: "sky" },
  { deger: "kargoda", etiket: "Kargoda", renk: "sky" },
  { deger: "garanti_kapsaminda", etiket: "Garanti Kapsamında", renk: "nova" },
  { deger: "teslim_alinmadi", etiket: "Teslim Alınmadı (Bekliyor)", renk: "red" },
  { deger: "iptal", etiket: "İptal", renk: "slate" },
  { deger: "onarilamadi", etiket: "Onarılamadı", renk: "red" },
  { deger: "musteri_vazgecti", etiket: "Müşteri Vazgeçti", renk: "slate" },
  { deger: "hurda", etiket: "Hurda / Parça İçin Ayrıldı", renk: "slate" },
] as const;

export type ServisDurum = (typeof DURUMLAR)[number]["deger"];

const RENK_SINIFLARI: Record<string, string> = {
  slate: "bg-slate-500/15 text-slate-300",
  sky: "bg-sky-500/15 text-sky-300",
  amber: "bg-amber-500/15 text-amber-300",
  nova: "bg-nova-500/15 text-nova-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  red: "bg-red-500/15 text-red-300",
};

export function durumEtiket(deger: string): string {
  return DURUMLAR.find((d) => d.deger === deger)?.etiket ?? deger;
}

export function durumSinifi(deger: string): string {
  const renk = DURUMLAR.find((d) => d.deger === deger)?.renk ?? "slate";
  return RENK_SINIFLARI[renk];
}

export const ONCELIKLER = [
  { deger: "dusuk", etiket: "Düşük", sinif: "bg-slate-500/15 text-slate-400" },
  { deger: "normal", etiket: "Normal", sinif: "bg-slate-500/15 text-slate-300" },
  { deger: "yuksek", etiket: "Yüksek", sinif: "bg-amber-500/15 text-amber-300" },
  { deger: "acil", etiket: "Acil", sinif: "bg-red-500/15 text-red-300" },
] as const;

export function oncelikBul(deger: string) {
  return ONCELIKLER.find((o) => o.deger === deger) ?? ONCELIKLER[1];
}

// Cihaz türüne göre fiziksel kabul kontrol listesi (Bölüm 12.1)
export const KONTROL_LISTESI_SABLONLARI: Record<string, string[]> = {
  laptop: [
    "Ekran",
    "Klavye",
    "Touchpad",
    "USB Portları",
    "HDMI",
    "Şarj Girişi",
    "Kamera",
    "Mikrofon",
    "Hoparlör",
    "Kasa",
    "Vida/Kapak Durumu",
  ],
  desktop: ["Güç Butonu", "USB Portları", "Ekran Kartı Çıkışı", "Fan/Soğutma", "Kasa"],
  phone: [
    "Ekran",
    "Kamera",
    "Face ID / Biyometrik",
    "Şarj",
    "Hoparlör",
    "Mikrofon",
    "SIM",
    "Kasa",
  ],
  tablet: ["Ekran", "Kamera", "Şarj", "Hoparlör", "Mikrofon", "Kasa"],
  console: ["Güç", "Disk Sürücü", "Kumanda Bağlantısı", "HDMI Çıkışı", "Fan"],
  printer: ["Kağıt Besleme", "Kartuş/Toner", "Bağlantı Portları", "Ekran/Panel"],
  monitor: ["Panel Görüntüsü", "Görüntü Girişleri", "Güç", "Ayak/Stand"],
  other: ["Genel Fiziksel Durum"],
};

export const KABUL_BEYAN_METNI =
  "Cihazdaki veriler yedeklenmemiştir; veri kaybından işletme sorumlu tutulamaz. " +
  "Sıvı temaslı veya fiziksel hasarlı cihazlarda işlem sonrası çalışma garantisi verilmez. " +
  "Yukarıdaki fiziksel durum ve aksesuar bilgilerini müşteri huzurunda kontrol ettim; " +
  "servis kabul koşullarını okudum ve kabul ediyorum.";
