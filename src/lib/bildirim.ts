// Bildirimler modülü — WhatsApp/SMS sağlayıcı soyutlaması ve şablon kataloğu.
//
// SandboxSaglayici gerçek bir WhatsApp Business API / SMS ağ geçidi
// kimlik bilgisi olmadığı için mesajı gerçekten göndermez — yalnızca
// başarılı olduğunu simüle eder. notification_log tablosuna yazma işi
// çağıran tarafta (RPC veya cron route) yapılır; bu dosya yalnız
// "gönderim" adımını soyutlar. Gerçek bir sağlayıcıya geçiş için tek
// yapılması gereken bu dosyadaki gonder() fonksiyonunu gerçek bir HTTP
// isteğiyle değiştirmektir — geri kalan mimari (kuyruk, tetikleyici,
// cron) değişmeden kalır.

export type BildirimKanal = "whatsapp" | "sms";
export type SablonTipi = "islemsel" | "pazarlama";

export type BildirimSablonu = {
  key: string;
  ad: string;
  tip: SablonTipi;
  metinOlustur: (degiskenler: Record<string, string>) => string;
};

export const BILDIRIM_SABLONLARI: BildirimSablonu[] = [
  {
    key: "servis_hazir",
    ad: "Servis Hazır",
    tip: "islemsel",
    metinOlustur: (d) =>
      `Sayın ${d.musteriAdi ?? ""}, ${d.servisNo ?? ""} numaralı servis kaydınız hazır — teslim alabilirsiniz.`,
  },
  {
    key: "odeme_hatirlatma",
    ad: "Ödeme Hatırlatma",
    tip: "islemsel",
    metinOlustur: (d) =>
      `Sayın ${d.musteriAdi ?? ""}, ${d.tutar ?? ""} tutarındaki açık hesap bakiyeniz için ödeme hatırlatmasıdır.`,
  },
  {
    key: "kampanya",
    ad: "Kampanya / Duyuru",
    tip: "pazarlama",
    metinOlustur: (d) => d.mesaj ?? "",
  },
  {
    key: "serbest_metin",
    ad: "Serbest Metin",
    tip: "islemsel",
    metinOlustur: (d) => d.mesaj ?? "",
  },
];

export function sablonBul(key: string): BildirimSablonu | undefined {
  return BILDIRIM_SABLONLARI.find((s) => s.key === key);
}

export const KANAL_ADLARI: Record<BildirimKanal, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
};

export const KANAL_IKONLARI: Record<BildirimKanal, string> = {
  whatsapp: "💬",
  sms: "✉️",
};

export const DURUM_ETIKETLERI: Record<string, string> = {
  beklemede: "Kuyrukta",
  gonderildi: "Gönderildi",
  basarisiz: "Başarısız",
};

// Sandbox sağlayıcı — her zaman başarılı döner, hiçbir dış API çağırmaz.
// Gerçek entegrasyon: bu fonksiyonu WhatsApp Business API / Netgsm vb.
// bir SMS ağ geçidine gerçek bir fetch() çağrısıyla değiştirin.
export async function sandboxGonder(_params: {
  kanal: BildirimKanal;
  telefon: string;
  mesaj: string;
}): Promise<{ basarili: true }> {
  return { basarili: true };
}
