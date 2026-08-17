import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { etkinKurlar, paraFormatla } from "@/lib/doviz";

export const metadata: Metadata = { title: "Genel Bakış — ByteNova" };

// Servis bu durumlardaysa "kapanmış" sayılır — açık servis sayacına girmez.
const KAPANMIS_SERVIS_DURUMLARI = [
  "teslim_edildi",
  "iptal",
  "onarilamadi",
  "musteri_vazgecti",
  "hurda",
];

type Kart = {
  baslik: string;
  deger: string;
  alt: string;
  ikon: string;
  href: string;
  vurgu?: boolean;
};

export default async function GenelBakisPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();
  const rol = profil?.role;

  const satisGorebilir = yetkiVar(rol, "satis_yap");
  const kasaGorebilir = yetkiVar(rol, "kasa_yonet");
  const servisGorebilir = yetkiVar(rol, "servis_yonet");
  const stokGorebilir = yetkiVar(rol, "stok_yonet");
  const kurGorebilir = yetkiVar(rol, "kasa_yonet") || yetkiVar(rol, "maliyet_gor");

  // "Bugün" Türkiye saatine göre (UTC+3, DST yok) — diğer modüllerle aynı desen.
  const bugunIstanbul = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const gunBaslangic = new Date(`${bugunIstanbul}T00:00:00+03:00`).toISOString();

  const [
    { data: kritikUrunler },
    { data: satislar },
    { data: tahsilatlar },
    { count: acikServisSayisi },
    { count: teslimSayisi },
    { count: onayBekleyenSayisi },
    { count: teslimAlinmayanSayisi },
    { data: tedarikciler },
    kurlar,
  ] = await Promise.all([
    // Dijital ürünlerin "stoğu" stock_quantity değil anahtar havuzudur (bkz.
    // /panel/stok'taki ayrı kritik-anahtar rozeti) — bu hızlı özet kartı
    // yalnız fiziksel ürünleri sayar.
    supabase.from("products").select("id, stock_quantity, critical_stock").eq("is_active", true).eq("is_digital", false),
    supabase.from("sales").select("total_amount").gte("created_at", gunBaslangic),
    supabase.from("cash_movements").select("amount").gt("amount", 0).gte("created_at", gunBaslangic),
    supabase
      .from("service_orders")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${KAPANMIS_SERVIS_DURUMLARI.join(",")})`),
    supabase
      .from("service_orders")
      .select("id", { count: "exact", head: true })
      .gte("delivered_at", gunBaslangic),
    supabase
      .from("service_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "onay_bekliyor"),
    supabase
      .from("service_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "teslim_alinmadi"),
    supabase.from("suppliers").select("balance, currency, avg_exchange_rate").neq("balance", 0),
    etkinKurlar(supabase),
  ]);

  const kritikSayisi = (kritikUrunler ?? []).filter(
    (u) => u.stock_quantity <= u.critical_stock
  ).length;

  const satisAdedi = satislar?.length ?? 0;
  const satisToplam = (satislar ?? []).reduce((t, s) => t + s.total_amount, 0);
  const tahsilatToplam = (tahsilatlar ?? []).reduce((t, h) => t + h.amount, 0);

  // Kur etkisi: açık dövizli tedarikçi borçlarının ortalama maliyet kuruyla
  // bugünkü kur arasındaki fark — "bugün kapatsaydınız ne kadar kur farkı
  // öderdiniz/kazanırdınız" (Gün 22'deki avg_exchange_rate'in yeniden kullanımı).
  const kurEtkisiTL = (tedarikciler ?? []).reduce((t, ted) => {
    if (ted.currency === "TRY" || ted.avg_exchange_rate == null) return t;
    const guncelKur = kurlar.get(ted.currency)?.rate_to_try;
    if (!guncelKur) return t;
    return t + ted.balance * (guncelKur - ted.avg_exchange_rate);
  }, 0);
  const kurEtkisiGosterilsin = kurGorebilir && Math.abs(kurEtkisiTL) > 1;

  const ozetCumleleri: string[] = [];
  if (satisGorebilir && satisAdedi > 0) {
    ozetCumleleri.push(
      `Bugün ${satisAdedi} satışla ${paraFormatla(satisToplam)} ciro yaptınız.`
    );
  }
  if (kasaGorebilir && tahsilatToplam > 0) {
    ozetCumleleri.push(`Kasaya bugün ${paraFormatla(tahsilatToplam)} girdi.`);
  }
  if (servisGorebilir && (onayBekleyenSayisi ?? 0) > 0) {
    ozetCumleleri.push(
      `${onayBekleyenSayisi} servis müşteri onayı bekliyor.`
    );
  }
  if (servisGorebilir && (teslimSayisi ?? 0) > 0) {
    ozetCumleleri.push(`Bugün ${teslimSayisi} cihaz teslim edildi.`);
  }
  if (stokGorebilir && kritikSayisi > 0) {
    ozetCumleleri.push(`${kritikSayisi} üründe stok kritik seviyenin altında.`);
  }
  if (kurEtkisiGosterilsin) {
    ozetCumleleri.push(
      kurEtkisiTL > 0
        ? `Kur hareketleri nedeniyle açık tedarikçi borçlarınızda yaklaşık ${paraFormatla(kurEtkisiTL)} kur farkı gideri birikti.`
        : `Kur hareketleri şu an lehinize — açık tedarikçi borçlarınızda yaklaşık ${paraFormatla(Math.abs(kurEtkisiTL))} kur farkı avantajı var.`
    );
  }
  if (ozetCumleleri.length === 0) {
    ozetCumleleri.push("Bugün henüz bir hareket yok — panel her işlemde otomatik güncellenir.");
  }

  const kartlar: Kart[] = [
    {
      baslik: "Kritik Stok",
      deger: String(kritikSayisi),
      alt: kritikSayisi > 0 ? "Ürüne tıklayıp stok girin" : "Tümü yeterli seviyede ✓",
      ikon: "⚠️",
      href: "/panel/stok?kritik=1",
      vurgu: kritikSayisi > 0,
    },
  ];

  if (satisGorebilir) {
    kartlar.push({
      baslik: "Bugünkü Satış",
      deger: paraFormatla(satisToplam),
      alt: satisAdedi > 0 ? `${satisAdedi} satış` : "Henüz satış yok",
      ikon: "🧾",
      href: "/panel/satis",
    });
  }
  if (kasaGorebilir) {
    kartlar.push({
      baslik: "Bugünkü Tahsilat",
      deger: paraFormatla(tahsilatToplam),
      alt: "Kasaya giren tutar",
      ikon: "💰",
      href: "/panel/finans",
    });
  }
  if (servisGorebilir) {
    kartlar.push({
      baslik: "Açık Servisler",
      deger: String(acikServisSayisi ?? 0),
      alt: "Devam eden servis",
      ikon: "🔧",
      href: "/panel/servisler",
    });
    kartlar.push({
      baslik: "Bugün Teslimler",
      deger: String(teslimSayisi ?? 0),
      alt: "Bugün teslim edilen cihaz",
      ikon: "📦",
      href: "/panel/servisler?durum=teslim_edildi",
    });
    kartlar.push({
      baslik: "Onay Bekleyen",
      deger: String(onayBekleyenSayisi ?? 0),
      alt: "Müşteri onayı bekleyen servis",
      ikon: "⏳",
      href: "/panel/servisler?durum=onay_bekliyor",
      vurgu: (onayBekleyenSayisi ?? 0) > 0,
    });
    kartlar.push({
      baslik: "Teslim Alınmayanlar",
      deger: String(teslimAlinmayanSayisi ?? 0),
      alt: "Hazır ama alınmayan cihaz",
      ikon: "📮",
      href: "/panel/servisler?durum=teslim_alinmadi",
      vurgu: (teslimAlinmayanSayisi ?? 0) > 0,
    });
  }
  if (kurEtkisiGosterilsin) {
    kartlar.push({
      baslik: "Kur Etkisi",
      deger: `${kurEtkisiTL > 0 ? "+" : ""}${paraFormatla(kurEtkisiTL)}`,
      alt: "Açık döviz borcunda kur farkı",
      ikon: "💱",
      href: "/panel/finans/cari-yaslandirma",
      vurgu: kurEtkisiTL > 0,
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Genel Bakış</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            İşletmenizin bugünkü durumu
          </p>
        </div>
      </div>

      {/* Akıllı özet */}
      <div className="mt-6 space-y-1.5 rounded-xl border border-nova-500/20 bg-nova-500/5 px-5 py-4 text-sm leading-relaxed text-nova-200/90">
        {ozetCumleleri.map((c, i) => (
          <p key={i}>{i === 0 ? "👋 " : ""}{c}</p>
        ))}
      </div>

      {kritikSayisi > 0 && (
        <Link
          href="/panel/stok?kritik=1"
          className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3.5 text-sm text-red-200 transition hover:border-red-500/50"
        >
          <span className="text-lg">⚠️</span>
          <span>
            <span className="font-semibold">{kritikSayisi} ürün</span> kritik
            stok seviyesinin altında — stoğu kontrol edin →
          </span>
        </Link>
      )}

      {/* Durum kartları */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kartlar.map((k) => (
          <Link
            key={k.baslik}
            href={k.href}
            className={`glass rounded-xl p-4 transition hover:border-nova-500/30 ${
              k.vurgu ? "border-red-500/25" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{k.baslik}</span>
              <span className="text-base">{k.ikon}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${k.vurgu ? "text-red-300" : "text-slate-200"}`}>
              {k.deger}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">{k.alt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
