import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { paraFormatla } from "@/lib/doviz";
import { BELGE_TIPLERI, ODEME_YONTEMLERI_KARMA, iadeSonucEtiket, iadeSonucIkon, kalemEtiket, kalemIkon } from "@/lib/satis";
import { SatisBelgesi } from "@/components/satis/SatisBelgesi";
import { IadeBaslat } from "@/components/satis/IadeBaslat";

export const metadata: Metadata = { title: "Satış Detayı — ByteNova" };

export default async function SatisDetayPage({
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

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const yetkili = yetkiVar(profil?.role, "satis_yap");

  const { data: satis } = await supabase
    .from("sales")
    .select(
      "id, sale_no, subtotal, discount_amount, rounding_amount, total_amount, payment_method, document_type, receipt_no, document_issued_at, created_at, customers(id, name, phone)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!satis) notFound();

  const [{ data: kalemlerHam }, { data: odemeler }, { data: iadelerHam }] = await Promise.all([
    supabase
      .from("sale_items")
      .select("id, item_type, product_id, name, quantity, unit_price, discount_amount, line_total, assigned_license_keys")
      .eq("sale_id", id)
      .order("id"),
    supabase
      .from("sale_payments")
      .select("id, method, amount, installments, cash_accounts(name)")
      .eq("sale_id", id),
    supabase
      .from("returns")
      .select("id, return_no, sale_item_id, quantity, status, inspection_result, received_at")
      .eq("sale_id", id)
      .order("received_at", { ascending: false }),
  ]);

  const iadelerByKalem = new Map<string, { toplamIadeEdilen: number; kayitlar: typeof iadelerHam }>();
  for (const iade of iadelerHam ?? []) {
    const mevcut = iadelerByKalem.get(iade.sale_item_id) ?? { toplamIadeEdilen: 0, kayitlar: [] };
    if (iade.status !== "iptal") mevcut.toplamIadeEdilen += iade.quantity;
    mevcut.kayitlar = [...(mevcut.kayitlar ?? []), iade];
    iadelerByKalem.set(iade.sale_item_id, mevcut);
  }

  const musteri = satis.customers as unknown as { id: string; name: string; phone: string | null } | null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/panel/satis" className="text-xs text-slate-500 transition-colors hover:text-nova-300">
        ← Satış
      </Link>

      <div className="glass mt-3 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-mono text-lg font-bold text-white">{satis.sale_no}</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {new Date(satis.created_at).toLocaleString("tr-TR")}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              satis.document_type === "okc_fisi"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {BELGE_TIPLERI[satis.document_type] ?? satis.document_type}
            {satis.receipt_no && ` — ${satis.receipt_no}`}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Müşteri</p>
            {musteri ? (
              <Link
                href={`/panel/musteriler/${musteri.id}`}
                className="mt-0.5 block text-sm font-medium text-nova-300 hover:text-nova-50"
              >
                👤 {musteri.name}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">Misafir</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-surface px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Ödeme</p>
            <p className="mt-0.5 text-sm text-slate-200">
              {ODEME_YONTEMLERI_KARMA[satis.payment_method] ?? satis.payment_method}
            </p>
          </div>
        </div>

        {!!odemeler?.length && (
          <div className="mt-3 space-y-1">
            {odemeler.map((o) => {
              const hesap = o.cash_accounts as unknown as { name: string } | null;
              return (
                <div key={o.id} className="flex justify-between text-xs text-slate-500">
                  <span>
                    {ODEME_YONTEMLERI_KARMA[o.method] ?? o.method}
                    {hesap?.name && ` · ${hesap.name}`}
                    {o.installments && o.installments > 1 && ` · ${o.installments} taksit`}
                  </span>
                  <span>{paraFormatla(o.amount)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 space-y-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Ara toplam</span>
            <span>{paraFormatla(satis.subtotal)}</span>
          </div>
          {satis.discount_amount > 0 && (
            <div className="flex justify-between">
              <span>Genel iskonto</span>
              <span>-{paraFormatla(satis.discount_amount)}</span>
            </div>
          )}
          {satis.rounding_amount !== 0 && (
            <div className="flex justify-between">
              <span>Yuvarlama</span>
              <span>{paraFormatla(satis.rounding_amount)}</span>
            </div>
          )}
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-300">Toplam</span>
          <span className="text-xl font-bold text-white">{paraFormatla(satis.total_amount)}</span>
        </div>
      </div>

      {satis.document_type === "sonra_kesilecek" && (
        <div className="mt-4">
          <SatisBelgesi saleId={satis.id} yetkili={yetkili} />
        </div>
      )}

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Kalemler</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {(kalemlerHam ?? []).map((k) => {
            const iadeBilgisi = iadelerByKalem.get(k.id);
            const iadeEdilebilir = k.quantity - (iadeBilgisi?.toplamIadeEdilen ?? 0);
            return (
              <div key={k.id} className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">{kalemIkon(k.item_type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">
                      {k.name} <span className="text-slate-500">× {k.quantity}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {kalemEtiket(k.item_type)}
                      {k.discount_amount > 0 && ` · İndirim: ${paraFormatla(k.discount_amount)}`}
                      {iadeBilgisi && iadeBilgisi.toplamIadeEdilen > 0 && (
                        <span className="text-amber-300"> · {iadeBilgisi.toplamIadeEdilen} iade edildi</span>
                      )}
                    </p>
                    {!!k.assigned_license_keys?.length && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {k.assigned_license_keys.map((anahtar: string) => (
                          <span
                            key={anahtar}
                            className="rounded border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] text-purple-300"
                          >
                            🔑 {anahtar}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-200">
                    {paraFormatla(k.line_total)}
                  </span>
                </div>
                {k.item_type === "urun" && !k.assigned_license_keys?.length && (
                  <div className="mt-1.5 pl-8">
                    <IadeBaslat
                      saleItemId={k.id}
                      urunAdi={k.name}
                      iadeEdilebilirMiktar={iadeEdilebilir}
                      yetkili={yetkili}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!!iadelerHam?.length && (
        <div className="glass mt-4 overflow-hidden rounded-xl">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">İadeler</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {iadelerHam.map((iade) => (
              <div key={iade.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="font-mono text-sm text-slate-200">{iade.return_no}</p>
                  <p className="text-[11px] text-slate-500">
                    {iade.quantity} adet · {new Date(iade.received_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    iade.status === "kontrol_edildi"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {iade.status === "kontrol_edildi" && iade.inspection_result
                    ? `${iadeSonucIkon(iade.inspection_result)} ${iadeSonucEtiket(iade.inspection_result)}`
                    : "Kontrol Bekliyor"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
