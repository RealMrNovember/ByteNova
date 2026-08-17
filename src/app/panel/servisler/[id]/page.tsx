import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cihazIkon } from "@/lib/cihaz";
import { durumEtiket, durumSinifi, oncelikBul } from "@/lib/servis";
import { yetkiVar } from "@/lib/yetki";
import { ServisIslemleri } from "@/components/servis/ServisIslemleri";
import { FotografYukle } from "@/components/servis/FotografYukle";
import { TeslimPaneli } from "@/components/servis/TeslimPaneli";
import { BelgeIslemleri } from "@/components/servis/BelgeIslemleri";
import { ServisParcalari } from "@/components/servis/ServisParcalari";
import { ServisParcaTalebi } from "@/components/servis/ServisParcaTalebi";
import { ServisTahsilat } from "@/components/servis/ServisTahsilat";
import { TeshisUcreti } from "@/components/servis/TeshisUcreti";
import { KAPANMIS_DURUMLAR, isGunuSayisi, AZAMI_TAMIR_SURESI_IS_GUNU } from "@/lib/servis";
import { paraFormatla } from "@/lib/doviz";

type Aksesuar = { name: string; delivered: boolean };

export default async function ServisDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  const { data: s } = await supabase
    .from("service_orders")
    .select(
      "*, customers(id, name, phone), devices(id, device_type, brand, model, serial_no)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!s) notFound();

  const musteri = s.customers as unknown as {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  const cihaz = s.devices as unknown as {
    id: string;
    device_type: string;
    brand: string | null;
    model: string | null;
    serial_no: string | null;
  } | null;

  const [
    { data: gecmis },
    { data: kullanicilar },
    { data: notSatirlari },
    { data: fotograflar },
    { data: whatsappAbonelik },
    { data: parcalarHam },
    { data: kasaHesaplari },
  ] = await Promise.all([
    supabase
      .from("service_status_history")
      .select("from_status, to_status, note, created_at")
      .eq("service_order_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name"),
    supabase
      .from("service_notes")
      .select("id, content, created_at, user_id")
      .eq("service_order_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_photos")
      .select("id, storage_path")
      .eq("service_order_id", id)
      .order("created_at"),
    supabase
      .from("tenant_addon_subscriptions")
      .select("status")
      .eq("addon_key", "whatsapp_sms")
      .maybeSingle(),
    supabase
      .from("service_parts")
      .select(
        "id, product_id, quantity, unit_price, status, removed_part_disposition, removed_part_note, products(name)"
      )
      .eq("service_order_id", id)
      .order("reserved_at", { ascending: false }),
    supabase.from("cash_accounts").select("id, name, type").eq("is_active", true).order("created_at"),
  ]);

  const { data: parcaTalepleriHam } = await supabase
    .from("purchase_requests")
    .select("id, quantity, status, note, requested_at, products(name)")
    .eq("service_order_id", id)
    .order("requested_at", { ascending: false });

  const [{ data: kaynakServis }, { data: tekrarServisler }, { data: tenantAyar }] = await Promise.all([
    s.source_service_id
      ? supabase.from("service_orders").select("id, service_no").eq("id", s.source_service_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("service_orders").select("id, service_no, status, created_at").eq("source_service_id", id),
    supabase.from("tenants").select("default_warranty_days").eq("id", s.tenant_id).single(),
  ]);

  const adSozlugu = new Map(
    (kullanicilar ?? []).map((k) => [k.id, k.full_name ?? "İsimsiz"])
  );
  const notlar = (notSatirlari ?? []).map((n) => ({
    ...n,
    yazan: n.user_id ? (adSozlugu.get(n.user_id) ?? "Silinmiş kullanıcı") : "Sistem",
  }));

  const teknisyenAdi = s.technician_id ? adSozlugu.get(s.technician_id) : null;
  const checklist = (s.physical_condition ?? {}) as Record<string, boolean>;
  const checklistMaddeleri = Object.entries(checklist);
  const aksesuarlar = (s.accessories ?? []) as Aksesuar[];
  const oncelik = oncelikBul(s.priority);
  const yetkili = yetkiVar(profil?.role, "servis_yonet");
  const kasaYetkili = yetkiVar(profil?.role, "kasa_yonet");
  const teslimEdildiMi = s.status === "teslim_edildi";
  const whatsappEklentisiAktif =
    whatsappAbonelik?.status === "active" || whatsappAbonelik?.status === "trial";
  const parcalar = (parcalarHam ?? []).map((p) => {
    const urun = p.products as unknown as { name: string } | null;
    return {
      id: p.id,
      product_id: p.product_id,
      quantity: p.quantity,
      unit_price: p.unit_price,
      status: p.status as "reserved" | "consumed" | "cancelled",
      removed_part_disposition: p.removed_part_disposition,
      removed_part_note: p.removed_part_note,
      urunAdi: urun?.name ?? "Silinmiş ürün",
    };
  });

  const parcaTalepleri = (parcaTalepleriHam ?? []).map((t) => ({
    id: t.id,
    quantity: t.quantity,
    status: t.status,
    note: t.note,
    requested_at: t.requested_at,
    products: t.products as unknown as { name: string } | null,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/panel/servisler"
        className="text-xs text-slate-500 transition-colors hover:text-nova-300"
      >
        ← Servisler
      </Link>

      {/* Başlık kartı */}
      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-lg font-bold text-white">
                {s.service_no}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${durumSinifi(s.status)}`}
              >
                {durumEtiket(s.status)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${oncelik.sinif}`}
              >
                {oncelik.etiket}
              </span>
              {teknisyenAdi && (
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                  🔧 {teknisyenAdi}
                </span>
              )}
              {s.warranty_claim && !KAPANMIS_DURUMLAR.includes(s.status) && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    isGunuSayisi(s.created_at) >= AZAMI_TAMIR_SURESI_IS_GUNU
                      ? "bg-red-500/15 text-red-300"
                      : isGunuSayisi(s.created_at) >= AZAMI_TAMIR_SURESI_IS_GUNU - 5
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-nova-500/15 text-nova-300"
                  }`}
                >
                  🛡️ Garanti — {isGunuSayisi(s.created_at)}/{AZAMI_TAMIR_SURESI_IS_GUNU} iş günü
                </span>
              )}
              {s.diagnosis_fee_charged && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                  💰 Teşhis: {paraFormatla(s.diagnosis_fee ?? 0)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Kabul: {new Date(s.created_at).toLocaleString("tr-TR")}
              {kaynakServis && (
                <>
                  {" · "}Kaynak servis:{" "}
                  <Link href={`/panel/servisler/${kaynakServis.id}`} className="font-mono text-nova-300 hover:underline">
                    {kaynakServis.service_no}
                  </Link>
                </>
              )}
            </p>
            {(tekrarServisler ?? []).length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Bu cihaz için sonraki (garanti) servisler:{" "}
                {(tekrarServisler ?? []).map((t, i) => (
                  <span key={t.id}>
                    {i > 0 && ", "}
                    <Link href={`/panel/servisler/${t.id}`} className="font-mono text-nova-300 hover:underline">
                      {t.service_no}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
          {KAPANMIS_DURUMLAR.includes(s.status) && !s.warranty_claim && cihaz && (
            <Link
              href={`/panel/servisler/yeni?kaynak=${s.id}`}
              className="shrink-0 rounded-lg border border-nova-500/40 px-3.5 py-1.5 text-xs font-medium text-nova-300 transition hover:bg-nova-500/10"
            >
              🛡️ Garanti Kapsamında Tekrar Servis Aç
            </Link>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Müşteri
            </p>
            {musteri ? (
              <Link
                href={`/panel/musteriler/${musteri.id}`}
                className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50"
              >
                👤 {musteri.name}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">—</p>
            )}
            {musteri?.phone && (
              <p className="mt-0.5 text-xs text-slate-500">{musteri.phone}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Cihaz
            </p>
            {cihaz ? (
              <Link
                href={`/panel/cihazlar/${cihaz.id}`}
                className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50"
              >
                {cihazIkon(cihaz.device_type)}{" "}
                {[cihaz.brand, cihaz.model].filter(Boolean).join(" ") ||
                  "İsimsiz cihaz"}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">—</p>
            )}
            {cihaz?.serial_no && (
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {cihaz.serial_no}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Müşteri Beyanı
          </p>
          <p className="mt-1 text-sm text-slate-200">{s.declared_issue}</p>
        </div>

        {aksesuarlar.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Aksesuarlar
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {aksesuarlar.map((a) => (
                <span
                  key={a.name}
                  className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300"
                >
                  {a.delivered ? "✓" : "•"} {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {checklistMaddeleri.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Fiziksel Kabul Kontrolü
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {checklistMaddeleri.map(([madde, tamam]) => (
                <span
                  key={madde}
                  className={`text-xs ${tamam ? "text-slate-400" : "text-amber-300"}`}
                >
                  {tamam ? "✓" : "⚠"} {madde}
                </span>
              ))}
            </div>
          </div>
        )}

        {s.consent_accepted && s.consent_accepted_at && (
          <p className="mt-4 text-[11px] text-slate-600">
            ✓ Servis kabul koşulları müşteri huzurunda onaylandı —{" "}
            {new Date(s.consent_accepted_at).toLocaleString("tr-TR")}
          </p>
        )}
      </div>

      {/* Cihaz fotoğrafları */}
      <div className="mt-4">
        <FotografYukle
          servisId={s.id}
          tenantId={s.tenant_id}
          mevcut={fotograflar ?? []}
        />
      </div>

      {/* Durum, teknisyen atama, teknik notlar */}
      <div className="mt-4">
        <ServisIslemleri
          servisId={s.id}
          tenantId={s.tenant_id}
          mevcutDurum={s.status}
          mevcutTeknisyenId={s.technician_id}
          kullanicilar={kullanicilar ?? []}
          notlar={notlar}
          yetkili={yetkili}
        />
      </div>

      {/* Kullanılan parçalar */}
      <div className="mt-4">
        <ServisParcalari
          servisId={s.id}
          tenantId={s.tenant_id}
          yetkili={yetkili}
          parcalar={parcalar}
        />
      </div>

      {/* Parça talebi */}
      <div className="mt-4">
        <ServisParcaTalebi servisId={s.id} yetkili={yetkili} talepler={parcaTalepleri} />
      </div>

      {/* Ücretli teşhis */}
      {["fiyatlandirma_bekliyor", "onay_bekliyor"].includes(s.status) && (
        <div className="mt-4">
          <TeshisUcreti
            servisId={s.id}
            yetkili={yetkili}
            mevcutUcret={s.diagnosis_fee}
            ucretTahsilEdildi={s.diagnosis_fee_charged}
          />
        </div>
      )}

      {/* Kapora / avans */}
      <div className="mt-4">
        <ServisTahsilat
          servisId={s.id}
          avansAlinan={s.advance_paid ?? 0}
          yetkili={kasaYetkili}
          kasaHesaplari={kasaHesaplari ?? []}
        />
      </div>

      {/* Teslim işlemi */}
      <div className="mt-4">
        <TeslimPaneli
          servisId={s.id}
          aksesuarlar={aksesuarlar}
          teslimEdildiMi={teslimEdildiMi}
          teslimTarihi={s.delivered_at}
          yetkili={yetkili}
          kasaYetkili={kasaYetkili}
          mevcutFinalTutar={s.final_cost}
          avansAlinan={s.advance_paid ?? 0}
          kasaHesaplari={kasaHesaplari ?? []}
          varsayilanGarantiGun={tenantAyar?.default_warranty_days ?? 90}
        />
      </div>

      {/* Belgeler: PDF + WhatsApp */}
      <div className="mt-4">
        <BelgeIslemleri
          servisId={s.id}
          teslimEdildiMi={teslimEdildiMi}
          whatsappEklentisiAktif={whatsappEklentisiAktif}
        />
      </div>

      {/* Durum geçmişi */}
      <div className="glass mt-4 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white">Durum Geçmişi</h2>
        <div className="mt-4 space-y-0">
          {(gecmis ?? []).map((g, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-nova-400 bg-surface" />
                {i < (gecmis?.length ?? 0) - 1 && (
                  <span className="w-px flex-1 bg-slate-800" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm text-slate-200">
                  {durumEtiket(g.to_status)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  {new Date(g.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
