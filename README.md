<div align="center">

# ⚡ ByteNova

**Teknik servisin ve bilgisayarcının yeni nesil işletim sistemi.**

*Servisten satışa, kurdan kasaya — işletmenizin tamamı ByteNova'da.*

[![Durum](https://img.shields.io/badge/durum-tasar%C4%B1m%20%26%20planlama-blueviolet)](#-yol-haritası)
[![Platform](https://img.shields.io/badge/platform-Web%20%2B%20Masa%C3%BCst%C3%BC%20(Online%2FOffline)-00b4d8)](#-platform-mimarisi)
[![Pazar](https://img.shields.io/badge/pazar-T%C3%BCrkiye-e30a17)](#-türkiyeye-özel-tasarlandı)
[![Lisans](https://img.shields.io/badge/lisans-Proprietary-lightgrey)](LICENSE)

[cicibyte.com](https://cicibyte.com) • [Proje Dosyası](docs/ByteNova_PROJE_DOSYASI_v2.md) • [Yol Haritası](docs/ROADMAP.md)

</div>

---

## 📌 ByteNova Nedir?

ByteNova; bilgisayar mağazaları, teknik servisler ve elektronik servis işletmeleri için **servis, stok, alış-satış, döviz, e-belge, çek/senet, müşteri, kasa ve raporlama** süreçlerini tek platformda birleştiren; **online ve offline çalışabilen** profesyonel işletme yönetim yazılımıdır.

Bugün tipik bir işletmede aynı anda WhatsApp mesajları, Excel dosyaları, kâğıt servis formları, stok defteri, kasa notları, toptancı B2B ekranları ve sahibinin hafızası kullanılıyor. ByteNova bunları tek bir iş akışında birleştirir ve şu sorunun cevabını her an verebilir:

> *"Bu cihaz işletmeye nasıl girdi, kaça mal oldu, şu anda nerede, üzerinde ne yapıldı, müşteriye ne söylendi, hangi belge kesildi, ne kadar tahsil edildi ve ne kadar kâr kaldı?"*

### İki yaşam döngüsünün kesişimi

```
Servis döngüsü :  Giriş → Kabul → Teşhis → Teklif → Kapora → Onay → Parça → Onarım → Test → Teslim → Garanti
Ticari döngü   :  Toptancı (USD) → Alış → Stok → (PC Toplama) → Satış (TL) → Fiş/Fatura → Kasa/Çek → Kâr → Rapor
```

Bu iki döngünün kesiştiği yer ByteNova'nın asıl değeridir.

---

## 🇹🇷 Türkiye'ye Özel Tasarlandı

ByteNova'yı rakiplerinden ayıran şey, Türkiye'deki dükkânın **gerçeklerine** göre yazılmış olmasıdır:

| Gerçek | ByteNova'daki karşılığı |
|---|---|
| 💵 Parçalar dolarla alınır, lirayla satılır | Dövizli maliyet, canlı kur, toplu fiyat/etiket güncelleme, kur farkı takibi |
| 🧾 Perakendede belge fiştir | ÖKC (yazarkasa POS) entegrasyonu + e-Fatura / e-Arşiv / e-İrsaliye katmanı |
| 🤝 Pazarlık satışın doğasıdır | Satır & genel iskonto, yuvarlama, rol bazlı iskonto yetki limiti |
| 💳 Taksit ve komisyon gerçeği | Parametrik taksit kuralları, POS komisyonu ve bloke takibi, gün sonu mutabakat |
| 📝 Çekle iş döner | Alınan/verilen çek-senet portföyü, vade takvimi, nakit akış uyarıları |
| 🔧 PC toplamak bilgisayarcının işidir | Reçete (BOM), toplama emri, demontaj, parça hasadı |
| ♻️ İkinci el ticareti bir gerçek | Gider pusulası, özel matrah desteği, test raporu, cihaz yaşam döngüsü |
| 📦 Cihaz teslim alınmayabilir | Kademeli hatırlatma, ihtar şablonu, bekleme ücreti süreci |
| 👨‍💼 Muhasebeyi SMMM tutar | Tek tık "Muhasebeci Paketi" (Luca/Logo/Mikro/Zirve uyumlu export) |
| 📣 Kampanya SMS'i izne tabidir | İYS entegrasyonu, operasyonel/ticari ileti ayrımı |
| ⚖️ Mevzuat değişir | Vergi/taksit/e-belge kuralları kodda değil, versiyonlu kural motorunda |

---

## 🖥 Platform Mimarisi

Tek çekirdek, üç yüzey:

| Yüzey | Amaç |
|---|---|
| 🌐 **Showroom** | Halka açık tanıtım sitesi; Giriş / Kayıt kapısı ve etkileşimli demo |
| 📊 **Web Paneli** | Tam responsive işletme yönetim paneli — telefonda, tablette, masaüstünde |
| 💻 **Masaüstü Uygulaması** | **Online + Offline** çalışma, yazıcı / barkod / ÖKC donanım köprüsü |
| 🛡 **Yönetim Konsolu** | Platform ekibi için tenant, abonelik ve ödeme yönetimi (dahili) |

- İnternet kesildiğinde satış ve servis kabul **kesintisiz devam eder**; bağlantı gelince güvenli senkronizasyon yapılır.
- Panele girildiğinde ürünün **tüm vizyonu menüde görünür** — henüz tamamlanmamış modüller zarif `YAKINDA` rozetleriyle yerini alır.
- Karanlık tema varsayılan; `Ctrl+K` komut paleti, klavye öncelikli akışlar, kompakt veri yoğunluğu ve 60 fps mikro animasyonlarla **teknolojiyi hissettiren** bir deneyim.

---

## 🧩 Modüller

**Servis** — Kabul, fotoğraf, aksesuar, checklist, durum makinesi, kanban, teknisyen ekranı, kapora/avans, müşteri onayı (SMS/QR), sökülen parça takibi, dış servis & kargo, teslim alınmayan cihazlar, servis garantisi

**Satış & Stok** — Hızlı satış (POS), iskonto & yetki, KDV dahil/hariç fiyat listeleri, taksit, dijital ürün (lisans key), seri no bazlı cihaz envanteri, negatif stok politikası, sayım, uyumluluk matrisi

**Alım & Tedarik** — Dövizli alış, toptancı XML/B2B fiyat çekme, konsinye, satın alma talepleri

**Finans** — Kasa, karma tahsilat, giderler, çek/senet, POS mutabakat, dövizli cari, mutabakat/ekstre

**Belge** — ÖKC fişi, e-Fatura/e-Arşiv/e-İrsaliye, gider pusulası, tevkifat, servis formları, teslim tutanağı

**Kurumsal** — Teklifler, periyodik bakım sözleşmeleri (SLA), toplu iş emri, açık hesap

**Diğer** — CRM & müşteri 360°, ikinci el/yenilenmiş operasyon, garanti takibi, prim, raporlama, bildirimler & İYS, KVKK araçları, rol/yetki (RBAC), audit log, Excel ile devir (cari bakiye ve açık servisler dahil)

Detaylı gereksinimler için: **[ByteNova Proje Dosyası v2.0](docs/ByteNova_PROJE_DOSYASI_v2.md)**

---

## 🛠 Teknoloji Yaklaşımı

| Katman | Tercih |
|---|---|
| Frontend | React / Next.js — Showroom (SSR) + Panel (SPA/PWA), tek tasarım sistemi |
| Masaüstü | Tauri (öncelikli) — lokal SQLite replika + donanım köprüsü + imzalı otomatik güncelleme |
| Backend | Modüler monolit API (domain sınırları korunarak) |
| Veritabanı | PostgreSQL (sunucu) + SQLite (offline replika) |
| Altyapı | Redis, S3 uyumlu depolama, Docker + CI/CD, Sentry |

Mimari ilkeler: çoklu tenant izolasyonu, sağlayıcı soyutlamaları (`InvoiceProvider`, `SmsProvider`, `FiscalDeviceProvider`…), event tabanlı yan işlemler, silme yerine denetim izi, offline outbox senkron deseni.

---

## 🗺 Yol Haritası

- **P0 — MVP:** Servis + satış + stok + döviz + kasa/gider + raporlar + masaüstü (offline çekirdek) + Showroom
- **P1:** e-Belge & ÖKC entegrasyonları, çek/senet, PC toplama (BOM), toptancı XML, bakım sözleşmeleri, WhatsApp/SMS + İYS, prim
- **P2:** Çok şube, mobil teknisyen, pazaryeri entegrasyonları, kargo, AI asistan, marketplace/eklenti altyapısı

Adım adım inşa planı için: **[docs/ROADMAP.md](docs/ROADMAP.md)**

---

## 📂 Depo İçeriği

| Dosya | Açıklama |
|---|---|
| [`docs/ByteNova_PROJE_DOSYASI_v2.md`](docs/ByteNova_PROJE_DOSYASI_v2.md) | Güncel ürün ve proje dosyası (v2.0) — ana referans |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Adım adım inşa yol haritası |
| [`docs/ByteNova_PROJE_DOSYASI.md`](docs/ByteNova_PROJE_DOSYASI.md) | İlk taslak (v1.0) — arşiv |
| [`LICENSE`](LICENSE) | Lisans |

---

## ⚖️ Lisans

Bu depo ve içeriği **CiciByte Teknoloji**'ye aittir. Tüm hakları saklıdır — ayrıntılar için [LICENSE](LICENSE) dosyasına bakınız.

---

<div align="center">

**CiciByte Teknoloji** • [cicibyte.com](https://cicibyte.com)

*Bir cihaz işletmenin kapısından girdiği anda ByteNova onun dijital yaşam döngüsünü başlatır.*

</div>
