// Otomatik abonelik tahsilatı — sağlayıcı soyutlaması.
//
// Gerçek bir iyzico/PayTR kimlik bilgisi bu ortamda yok. Gerçek
// entegrasyonda kart bilgisi HİÇBİR ZAMAN ByteNova sunucusuna girmez —
// tenant sağlayıcının barındırdığı ödeme sayfasına yönlendirilir, geri
// dönüşte yalnızca bir token/son4hane alınır. SandboxSaglayici bu
// yönlendirmeyi simüle eder: gerçek kart verisi hiç işlenmez.
//
// Test senaryosu (sandbox sağlayıcılarda yaygın kural): son4hane "0002"
// ile "kart eklenirse" sonraki tüm tahsilat denemeleri bilinçli olarak
// başarısız döner — dunning (başarısız tahsilat) akışını test etmek için.

export type TahsilatSonucu =
  | { basarili: true; providerReferans: string }
  | { basarili: false; hata: string };

export interface BillingProvider {
  tahsilatYap(params: { tutar: number; token: string }): Promise<TahsilatSonucu>;
}

export class SandboxBillingProvider implements BillingProvider {
  async tahsilatYap({ tutar, token }: { tutar: number; token: string }): Promise<TahsilatSonucu> {
    if (token.endsWith("0002")) {
      return { basarili: false, hata: "Sandbox test kartı: yetersiz bakiye simülasyonu" };
    }
    return { basarili: true, providerReferans: `sandbox_${Date.now()}_${Math.round(tutar * 100)}` };
  }
}

export const billingProvider: BillingProvider = new SandboxBillingProvider();

// Sandbox'ta gerçek bir "kart ekle" yönlendirmesi yoktur — bu fonksiyon
// o adımı simüle edip sahte ama biçimsel olarak geçerli bir token üretir.
// Gerçek entegrasyonda bu, sağlayıcının geri çağrısından (callback) gelir.
export function sandboxKartEkle(): { token: string; brand: string; last4: string } {
  const last4 = "4242";
  return { token: `sandbox_tok_${Date.now()}`, brand: "Visa (Sandbox)", last4 };
}
