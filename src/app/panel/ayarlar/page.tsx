import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { KullaniciYonetimi } from "@/components/panel/KullaniciYonetimi";
import { EklentilerListesi } from "@/components/panel/EklentilerListesi";
import { DovizKurlari } from "@/components/panel/DovizKurlari";
import { StokPolitikasi } from "@/components/panel/StokPolitikasi";
import { TaksitAyari } from "@/components/panel/TaksitAyari";
import { ServisAyarlari } from "@/components/panel/ServisAyarlari";
import { AbonelikBolumu } from "@/components/panel/AbonelikBolumu";
import { yetkiVar } from "@/lib/yetki";
import { TAKIP_EDILEN_KURLAR } from "@/lib/doviz";
import type { EklentiAbonelikDurum, EklentiPaketi } from "@/lib/eklenti";

export const metadata: Metadata = { title: "Ayarlar — ByteNova" };

const WHATSAPP_NUMARA = "905354895050";
const DESTEK_MESAJI = encodeURIComponent(
  "Merhaba, ByteNova hakkında destek almak istiyorum."
);

export default async function AyarlarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, role, tenants(*)")
    .eq("id", user.id)
    .single();

  const tenant = profil?.tenants as unknown as {
    name: string;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
    negative_stock_policy: "uyarili" | "onayli" | "yasak";
    max_installments: number;
    status: string;
    trial_ends_at: string | null;
    plan_id: string | null;
    billing_cycle: "aylik" | "yillik" | null;
    default_warranty_days: number;
    hazir_bekleme_gun: number;
  } | null;

  // Aynı tenant'taki kullanıcılar (RLS zaten sınırlıyor)
  const { data: kullanicilar } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("created_at", { ascending: true });

  // Bekleyen davetler (yalnız owner/manager görebilir — RLS)
  const { data: davetler } = await supabase
    .from("invitations")
    .select("id, email, role, token")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  // Eklenti kataloğu + tenant'ın mevcut abonelikleri
  const [{ data: paketler }, { data: abonelikSatirlari }] = await Promise.all([
    supabase
      .from("addon_packages")
      .select("*")
      .eq("status", "available")
      .order("sort_order"),
    supabase.from("tenant_addon_subscriptions").select("addon_key, status"),
  ]);

  const abonelikler: Record<string, EklentiAbonelikDurum> = {};
  for (const a of abonelikSatirlari ?? []) {
    abonelikler[a.addon_key] = a.status as EklentiAbonelikDurum;
  }

  const [{ data: plan }, { data: dekontlar }] = await Promise.all([
    tenant?.plan_id
      ? supabase
          .from("subscription_plans")
          .select("id, key, name, monthly_price, yearly_price, max_users")
          .eq("id", tenant.plan_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("payment_receipts")
      .select("id, amount, status, review_note, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const { data: odemeYontemi } = await supabase
    .from("tenant_payment_methods")
    .select("brand, last4, expiry_month, expiry_year")
    .maybeSingle();

  const ayarYonetebilir = yetkiVar(profil?.role, "ayar_yonet");

  // Abonelik olay geçmişi — konsoldan yapılan uzatma/askıya alma/plan
  // değişikliği gibi işlemler işletme sahibi/yöneticisi için de görünür
  // olmalı (şeffaflık ilkesi, Bölüm 65); tenant_events RLS'i bunu zaten
  // owner/manager'a açık tutuyor.
  const { data: abonelikOlaylari } = ayarYonetebilir
    ? await supabase
        .from("tenant_events")
        .select("id, event_type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  // Döviz kurları: TCMB (global) ve dükkân override'ı ayrı ayrı gösterilir
  const [{ data: paraBirimleri }, { data: tumKurSatirlari }] = await Promise.all([
    supabase
      .from("currencies")
      .select("code, name, symbol")
      .in("code", TAKIP_EDILEN_KURLAR)
      .order("sort_order"),
    supabase
      .from("exchange_rates")
      .select("currency_code, tenant_id, rate_to_try"),
  ]);

  const globalKurHaritasi = new Map<string, number>();
  const tenantKurHaritasi = new Map<string, number>();
  for (const r of tumKurSatirlari ?? []) {
    if (r.tenant_id === null) globalKurHaritasi.set(r.currency_code, Number(r.rate_to_try));
    else tenantKurHaritasi.set(r.currency_code, Number(r.rate_to_try));
  }

  const kurSatirlari = (paraBirimleri ?? []).map((p) => ({
    code: p.code,
    name: p.name,
    symbol: p.symbol,
    globalRate: globalKurHaritasi.get(p.code) ?? null,
    tenantRate: tenantKurHaritasi.get(p.code) ?? null,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-white">Ayarlar</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        İşletme bilgileri, kullanıcılar ve sistem tercihleri
      </p>

      <div className="mt-6 space-y-6">
        {/* İşletme bilgileri */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {tenant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logo_url}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-slate-700 object-contain"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nova-500/15 text-lg">
                  🏪
                </span>
              )}
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {tenant?.name ?? "İşletmem"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {tenant?.phone || "Telefon eklenmedi"} •{" "}
                  {tenant?.address || "Adres eklenmedi"}
                </p>
              </div>
            </div>
            {ayarYonetebilir && (
              <Link
                href="/kurulum"
                className="shrink-0 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
              >
                Düzenle
              </Link>
            )}
          </div>
        </div>

        {/* Kullanıcılar + davet */}
        <KullaniciYonetimi
          benimId={user.id}
          benimRol={profil?.role ?? ""}
          tenantId={profil?.tenant_id ?? ""}
          kullanicilar={kullanicilar ?? []}
          davetler={davetler ?? []}
        />

        {/* Döviz kurları — TCMB + dükkân override */}
        <DovizKurlari
          tenantId={profil?.tenant_id ?? ""}
          yetkili={ayarYonetebilir}
          kurlar={kurSatirlari}
        />

        {/* Negatif stok politikası */}
        <StokPolitikasi
          tenantId={profil?.tenant_id ?? ""}
          yetkili={ayarYonetebilir}
          mevcutPolitika={tenant?.negative_stock_policy ?? "uyarili"}
        />

        {/* Taksit limiti */}
        <TaksitAyari
          tenantId={profil?.tenant_id ?? ""}
          yetkili={ayarYonetebilir}
          mevcutLimit={tenant?.max_installments ?? 12}
        />

        {/* Servis ayarları — garanti süresi + teslim bekleme */}
        <ServisAyarlari
          tenantId={profil?.tenant_id ?? ""}
          yetkili={ayarYonetebilir}
          mevcutGarantiGun={tenant?.default_warranty_days ?? 90}
          mevcutBeklemeGun={tenant?.hazir_bekleme_gun ?? 15}
        />

        {/* Abonelik — plan, durum, dekont yükleme */}
        <AbonelikBolumu
          tenantId={profil?.tenant_id ?? ""}
          status={tenant?.status ?? "trial"}
          trialEndsAt={tenant?.trial_ends_at ?? null}
          plan={plan}
          billingCycle={tenant?.billing_cycle ?? null}
          dekontlar={dekontlar ?? []}
          olaylar={abonelikOlaylari ?? []}
          odemeYontemi={odemeYontemi}
          yukleyebilir={ayarYonetebilir}
        />

        {/* Eklentiler — ücretli modül kataloğu ve tek switch */}
        <EklentilerListesi
          yetkili={ayarYonetebilir}
          paketler={(paketler as EklentiPaketi[]) ?? []}
          abonelikler={abonelikler}
        />

        {/* Veri içe aktarma */}
        {ayarYonetebilir && (
          <div className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white">Veri İçe Aktarma</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Eski sisteminizden Excel (.xlsx) dosyasıyla müşteri, ürün, cihaz veya açık servis kayıtlarını toplu aktarın.
            </p>
            <Link
              href="/panel/import"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
            >
              📥 İçe Aktarma Sihirbazı
            </Link>
          </div>
        )}

        {/* Gelecek ayar blokları */}
        <div className="glass rounded-xl p-5 opacity-60">
          <h2 className="text-sm font-semibold text-slate-300">
            Vergi & e-Belge, Yazıcılar, Entegrasyonlar
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Bu ayar blokları ilgili modüllerle birlikte aktifleşecek.
          </p>
        </div>

        {/* Kullanım kılavuzu */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Kullanım Kılavuzu</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Takıldığınız veya anlamadığınız bir işlem mi var? Adım adım anlatımlar
            ve sık sorulan sorular için kılavuza göz atın.
          </p>
          <Link
            href="/panel/kilavuz"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-nova-500/50 hover:text-white"
          >
            📖 Kılavuza Git
          </Link>
        </div>

        {/* Destek */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white">Destek</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Bir sorunuz mu var? Doğrudan ekibimize ulaşın.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMARA}?text=${DESTEK_MESAJI}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-600/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
          >
            🟢 WhatsApp&apos;tan Yazın
          </a>
        </div>
      </div>
    </div>
  );
}
