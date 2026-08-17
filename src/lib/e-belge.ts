// e-Belge modülü — mükellef sorgulama ve etiket yardımcıları.
//
// mukellefSorgula() gerçek bir GİB API çağrısı YAPMAZ — bu ortamda
// böyle bir entegrasyon kimlik bilgisi yok. Yalnızca VKN'nin biçimsel
// olarak geçerli (10 haneli sayısal) olup olmadığına bakan bir sandbox
// sezgiseldir; gerçek mükellefiyet durumunu yansıtmaz. Gerçek bir
// entegratöre (GİB e-Fatura mükellef sorgulama servisi) geçişte bu
// fonksiyonun içi değiştirilir, çağıran kod değişmez.

export type EBelgeTipi = "e_fatura" | "e_arsiv_fatura" | "gider_pusulasi";

export const E_BELGE_ETIKETLERI: Record<EBelgeTipi, string> = {
  e_fatura: "e-Fatura",
  e_arsiv_fatura: "e-Arşiv Fatura",
  gider_pusulasi: "Gider Pusulası",
};

// VKN: 10 haneli sayısal. TCKN: 11 haneli sayısal (bireysel VKN alanında da kullanılabilir).
// Yalnızca biçim kontrolü — checksum algoritması uygulanmaz.
export function vknGecerliMi(deger: string): boolean {
  const temiz = deger.trim();
  return /^\d{10}$/.test(temiz) || /^\d{11}$/.test(temiz);
}

// Sandbox mükellef sorgulama: 10 haneli (VKN) ise e-Fatura mükellefi
// varsayılır, 11 haneli (TCKN, gerçek kişi) ise değildir. Gerçek bir
// entegrasyonda bu GİB'in mükellef sorgulama servisine gider.
export function mukellefSorgula(vkn: string): { mukellefMi: boolean; sandbox: true } {
  const temiz = vkn.trim();
  return { mukellefMi: /^\d{10}$/.test(temiz), sandbox: true };
}
