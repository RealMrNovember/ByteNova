# BYTENOVA — ÜCRETLİ EKLENTİ (ADD-ON) MİMARİSİ

**Durum:** Onaylanmış mimari karar (14 Ağustos 2026)
**İlişkili bölümler:** [ByteNova_PROJE_DOSYASI_v2.md](ByteNova_PROJE_DOSYASI_v2.md) Bölüm 9 (Feature Flag), Bölüm 58 (Paketleme), Bölüm 63-68 (Yönetim Konsolu), Bölüm 66 (Eklenti/Marketplace Modeli — bu doküman onun detaylandırılmış halidir)

---

## 1. Amaç

ByteNova'da bazı modüller (CRM, gelişmiş Stok, WhatsApp entegrasyonu vb.) çekirdek üründen ayrılıp **ayrı ücretli paketler** olarak satılabilmeli; işletme sahibi tek bir switch ile bu paketleri aktive edebilmeli.

## 2. İki Ayrı Monetizasyon Ekseni

| Eksen | Ne belirler | Bağımsızlık |
|---|---|---|
| **Plan katmanı** (Starter/Professional/Business/Enterprise — Bölüm 58) | Kullanıcı sayısı, şube sayısı, hacim limitleri | — |
| **Eklenti (Add-on)** | Belirli bir yetenek modülü | Plandan bağımsız satılır; Starter kullanıcı da tek bir eklenti alabilir |

## 3. Çekirdek/Eklenti Ayrım Kriteri

Bir modül şu sorulardan **en az ikisine "evet"** ise Eklenti, aksi halde Çekirdektir:
1. Dış servis maliyeti taşıyor mu? (SMS/WhatsApp API, e-Belge entegratörü, pazaryeri komisyonu)
2. İşletmelerin çoğunluğu değil azınlığı için kritik mi?
3. Servis/Cihaz/Müşteri çekirdek döngüsünden yapısal olarak ayrıştırılabiliyor mu?
4. Rakip ürünlerde tipik olarak "premium" konumlanıyor mu?

Servis, Cihazlar ve Müşteri/Stok'un **temel** halleri bu kritere göre çekirdekte kalır — bunlar olmadan ürün Bölüm 78'deki "fiziksel cihaz ↔ dijital kayıt bütünlüğü" değerini kaybeder ve küçük işletme (Persona A) ürünü terk eder.

## 4. Modül Haritası

### 🟢 Çekirdek (tüm planlara dahil, ücretsiz)

Dashboard, Servis (kabul→onarım→teslim temel akışı), Satış (temel POS), Alış (temel), Stok (tek depo, temel hareketler), Cihazlar, Müşteriler (temel: kayıt + iletişim geçmişi), Tedarikçiler (temel), Kasa/Tahsilat/Gider (temel), uygulama içi bildirimler, temel raporlar, Ayarlar/roller.

### 🔒 Ücretli Eklentiler (lansman kataloğu — 8 paket)

| # | Paket | İçerik | Faturalama modeli |
|---|---|---|---|
| 1 | **WhatsApp & SMS Paketi** | WhatsApp Business API, SMS gönderimi, İYS kampanya yönetimi, otomatik servis bildirimleri | Kullanım bazlı |
| 2 | **e-Belge Paketi** | e-Fatura/e-Arşiv/e-İrsaliye entegratör bağlantısı, gider pusulası otomasyonu | Hibrit (taban + aşım) |
| 3 | **CRM Plus** | Müşteri segmentasyonu, toplu kampanya mesajı, sadakat/puan sistemi, doğum günü hatırlatmaları, müşteri analitik panosu | Sabit aylık |
| 4 | **Stok Plus** | Çoklu depo/lokasyon, toptancı XML/B2B fiyat entegrasyonu, gelişmiş sayım, parça uyumluluk matrisi | Sabit aylık |
| 5 | **Finans Plus** | Çek/senet portföyü, POS mutabakat otomasyonu, dövizli cari + kur farkı otomasyonu, nakit akış projeksiyonu | Sabit aylık |
| 6 | **Kurumsal Satış Paketi** | Teklif yönetimi (PDF+QR onay), bakım sözleşmeleri, SLA takibi, toplu iş emri | Sabit aylık |
| 7 | **PC Toplama Paketi** | Reçete/BOM, toplama emri, demontaj | Sabit aylık |
| 8 | **Pazaryeri Paketi** | Trendyol/Hepsiburada/N11 stok/sipariş senkronu | Hibrit (taban + komisyon payı) |

Katalog zamanla genişletilebilir (İkinci El Cihaz Paketi, Raporlama Plus, Çok Şube Paketi, AI Asistan, Mobil Teknisyen — proje dosyası Bölüm 66'da listelidir). 13+ paketle başlamak satış/UX karmaşası yarattığından lansman 8 paketle sınırlanmalıdır.

## 5. Teknik Mimari

### 5.1. Veri modeli (Platform/Konsol seviyesi)

```sql
addon_packages (
  key text primary key,              -- 'whatsapp_sms', 'e_belge', 'crm_plus', ...
  name text not null,
  description text,
  monthly_price numeric,
  currency text default 'TRY',
  billing_model text check (billing_model in ('flat','usage_based','flat_plus_usage')),
  status text check (status in ('draft','available','deprecated')),
  feature_keys text[]                -- hangi menu/flag anahtarlarını kapsıyor
)

tenant_addon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  addon_key text references addon_packages(key),
  status text check (status in ('trial','active','past_due','cancelled')),
  activated_at timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  unique (tenant_id, addon_key)
)

addon_usage_events (                 -- kullanım bazlı paketler için sayaç
  id bigint generated always as identity primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  addon_key text,
  event_type text,                   -- 'whatsapp_message_sent', 'e_belge_issued'
  quantity int default 1,
  occurred_at timestamptz default now()
)
```

### 5.2. Menü çözümleme genişletmesi

Mevcut `ModulDurum` (`aktif | insa | yakinda` — `src/lib/menu.ts`, `src/lib/flags.ts`) sistemine **`kilitli`** durumu eklenir:

> Bir modül `addon_packages`'a bağlıysa VE tenant'ın o paket için `active`/`trial` durumunda aboneliği yoksa → durum `kilitli`.

**Önemli ayrım:** "Çok Yakında" = henüz inşa edilmedi, herkese ücretsiz gelecek. "Kilitli/Eklenti" = inşa edildi, satın alınabilir, anında açılır. İki farklı rozet, iki farklı mesaj, iki farklı CTA — kullanıcı deneyiminde asla karıştırılmamalıdır (Bölüm 9.1'deki PRO/BUSINESS rozet konsepti bu yapıyla resmileşir).

### 5.3. "Tek switch" — iki yer

1. **Yönetim Konsolu (Master Admin/Finans rolü):** Tenant 360° ekranına "Eklentiler" sekmesi, her paket yanında toggle. Manuel/telefon satışı için.
2. **Tenant paneli (self-servis):** Ayarlar → Eklentiler. `BillingProvider` (Bölüm 66) hazır olana dek switch, mevcut manuel ödeme (dekont onay) akışına düşer; otomatik ödeme geldiğinde doğrudan tahsilat + aktivasyon.

### 5.4. İptalde veri silinmez

Bir eklenti iptal edildiğinde ilgili veri **silinmez**, yalnız UI erişimi kilitlenir. Yeniden aktive edilince veri kaldığı yerden devam eder. Kritik İş Kuralı #2 (silme yerine audit) ile tutarlıdır ve yeniden satın almayı kolaylaştırır.

### 5.5. Deneme (trial)

Her eklenti opsiyonel "X gün ücretsiz dene" sunabilir; ana tenant deneme süresiyle **aynı state machine** (`trial → active → past_due`) kullanılır — kod tekrarı yoktur.

## 6. Riskler

- **Aşırı paket sayısı** → satış/karar karmaşası. Lansman 8 paketle sınırlı tutulmalı.
- **Yanlış çekirdek/eklenti sınırı** → küçük işletme ürünü terk eder. Stok ve Müşteriler'in temel halleri kesinlikle çekirdekte kalmalı, yalnız "Plus" katmanları eklentilenmeli.
- **Yetki karmaşası** → switch'i kimin açabileceği (Konsol: Finans/Platform Yöneticisi — Bölüm 64; Tenant: Sahip/Yönetici — Bölüm 23) net tanımlanmalı.

## 7. Uygulama Planı

| Ne zaman | Ne yapılır |
|---|---|
| Şimdi | Yalnız mimari karar; mevcut Sprint 2 (Servis modülü) inşasını etkilemez |
| Sprint 6, Gün 28-30 (Konsol inşası) | `addon_packages` + `tenant_addon_subscriptions` tabloları, `efektifMenu()`'ye `kilitli` durumu, Konsol'da toggle ekranı |
| Sprint 11 (P1, madde 4) | Tenant self-servis switch + otomatik ödeme + kullanım bazlı faturalama |
| İlk yayınlanacak paketler | WhatsApp/SMS ve e-Belge (P1'de zaten planlı, en somut dış maliyet) |

---

*Fiyatlandırma rakamları (TL bazında) bu dokümanda bilinçli olarak belirtilmemiştir — işletme sahibinin pazar/rekabet bilgisine bırakılmıştır. Sistem herhangi bir fiyat modelini (sabit/kullanım bazlı/hibrit) destekleyecek şekilde tasarlanmıştır.*
