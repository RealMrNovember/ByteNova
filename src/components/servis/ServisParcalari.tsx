"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SOKULEN_PARCA_AKIBETI } from "@/lib/stok";

type Urun = { id: string; name: string; stock_quantity: number; sale_price: number | null };
type Parca = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  status: "reserved" | "consumed" | "cancelled";
  removed_part_disposition: string | null;
  removed_part_note: string | null;
  urunAdi: string;
};

type Props = {
  servisId: string;
  tenantId: string;
  yetkili: boolean;
  parcalar: Parca[];
};

const alanSinifi =
  "w-full rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-nova-500";

export function ServisParcalari({ servisId, tenantId, yetkili, parcalar: ilk }: Props) {
  const router = useRouter();
  const [parcalar, setParcalar] = useState(ilk);

  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState<Urun | null>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  const [muadiller, setMuadiller] = useState<Urun[]>([]);

  const [miktar, setMiktar] = useState("1");
  const [sokulenVar, setSokulenVar] = useState(false);
  const [akibet, setAkibet] = useState("customer");
  const [not, setNot] = useState("");
  const [ekleniyor, setEkleniyor] = useState(false);
  const [onaylananId, setOnaylananId] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    function kapat(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);

  useEffect(() => {
    if (arama.trim().length < 2) {
      setSonuclar([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const q = arama.trim();
      const { data } = await supabase
        .from("products")
        .select("id, name, stock_quantity, sale_price")
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`)
        .eq("is_active", true)
        .limit(6);
      setSonuclar(data ?? []);
      setAcik(true);
    }, 250);
    return () => clearTimeout(t);
  }, [arama]);

  // Seçilen parça stokta yoksa, tanımlıysa muadil parçaları öner (Stok Plus).
  useEffect(() => {
    if (!secili || secili.stock_quantity > 0) {
      setMuadiller([]);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: iliskiler } = await supabase
        .from("product_compatibilities")
        .select("product_id, compatible_product_id")
        .or(`product_id.eq.${secili.id},compatible_product_id.eq.${secili.id}`);
      const digerIdler = (iliskiler ?? []).map((r) =>
        r.product_id === secili.id ? r.compatible_product_id : r.product_id
      );
      if (!digerIdler.length) {
        setMuadiller([]);
        return;
      }
      const { data: urunler } = await supabase
        .from("products")
        .select("id, name, stock_quantity, sale_price")
        .in("id", digerIdler)
        .eq("is_active", true);
      setMuadiller(urunler ?? []);
    })();
  }, [secili]);

  async function parcaEkle() {
    if (!secili) return;
    const adet = Number(miktar) || 0;
    if (adet <= 0) {
      setHata("Geçerli bir miktar girin.");
      return;
    }
    setEkleniyor(true);
    setHata(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("service_parts")
      .insert({
        tenant_id: tenantId,
        service_order_id: servisId,
        product_id: secili.id,
        quantity: adet,
        unit_price: secili.sale_price,
        removed_part_disposition: sokulenVar ? akibet : null,
        removed_part_note: sokulenVar ? not.trim() || null : null,
        reserved_by: user?.id,
      })
      .select("id, product_id, quantity, unit_price, status, removed_part_disposition, removed_part_note")
      .single();

    setEkleniyor(false);

    if (error || !data) {
      setHata("Parça eklenemedi.");
      return;
    }

    await supabase.rpc("audit_ekle", {
      p_action: "servis_parca_rezerve_edildi",
      p_entity: "service_part",
      p_entity_id: data.id,
      p_new: { product: secili.name, quantity: adet },
    });

    setParcalar((p) => [{ ...data, urunAdi: secili.name }, ...p]);
    setSecili(null);
    setArama("");
    setMiktar("1");
    setSokulenVar(false);
    setNot("");
  }

  async function onayla(parca: Parca, negatifOnay = false) {
    setOnaylananId(parca.id);
    setHata(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: yeniStok, error: stokHata } = await supabase.rpc("stok_hareketi_ekle", {
      p_product_id: parca.product_id,
      p_degisim: -parca.quantity,
      p_tip: "service_use",
      p_referans_tip: "service_order",
      p_referans_id: servisId,
      p_neden: `Servis parça kullanımı — ${parca.urunAdi}`,
      p_negatif_onay: negatifOnay,
    });

    if (stokHata) {
      setOnaylananId(null);
      if (stokHata.message.includes("NEGATIF_STOK_ONAY_GEREKLI")) {
        if (
          window.confirm(
            `${parca.urunAdi}: bu onay stoğu eksiye düşürecek. Yine de onaylıyor musunuz?`
          )
        ) {
          onayla(parca, true);
        }
        return;
      }
      setHata(
        stokHata.message.includes("STOK_YETERSIZ")
          ? "İşletme politikanız negatif stoğa izin vermiyor — önce stok girin."
          : "Stok güncellenemedi."
      );
      return;
    }

    const { error } = await supabase
      .from("service_parts")
      .update({ status: "consumed", consumed_by: user?.id, consumed_at: new Date().toISOString() })
      .eq("id", parca.id);

    setOnaylananId(null);

    if (!error) {
      await supabase.rpc("audit_ekle", {
        p_action: "servis_parca_onaylandi",
        p_entity: "service_part",
        p_entity_id: parca.id,
      });
      setParcalar((p) =>
        p.map((x) => (x.id === parca.id ? { ...x, status: "consumed" } : x))
      );
      if (typeof yeniStok === "number" && yeniStok < 0) {
        setHata(`⚠️ Not: ${parca.urunAdi} stoğu artık eksi (${yeniStok}).`);
      }
      router.refresh();
    }
  }

  return (
    <div className="glass rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white">Kullanılan Parçalar</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Parça rezerve edilir; onaylandığında stoktan düşer.
      </p>

      {yetkili && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-slate-800 bg-surface-2 p-3.5">
          <div className="relative" ref={kutuRef}>
            {secili ? (
              <>
                <div className="flex items-center justify-between rounded-lg border border-nova-500/40 bg-nova-500/10 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-nova-200">{secili.name}</p>
                    <p className="text-xs text-slate-500">Stokta: {secili.stock_quantity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecili(null)}
                    className="ml-2 shrink-0 text-xs text-slate-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
                {!!muadiller.length && (
                  <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5">
                    <p className="text-[11px] font-medium text-amber-300">
                      🔄 Stokta yok — muadil parçalar:
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {muadiller.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSecili(m)}
                          disabled={m.stock_quantity <= 0}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-slate-300 transition-colors hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span>{m.name}</span>
                          <span className={m.stock_quantity > 0 ? "text-emerald-300" : "text-slate-600"}>
                            Stok: {m.stock_quantity}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  onFocus={() => arama.trim().length >= 2 && setAcik(true)}
                  placeholder="🔍 Parça ara (ad, SKU, barkod)…"
                  className={alanSinifi}
                />
                {acik && sonuclar.length > 0 && (
                  <div className="glass absolute inset-x-0 top-11 z-30 max-h-56 overflow-y-auto rounded-xl p-1.5 shadow-xl">
                    {sonuclar.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSecili(u);
                          setAcik(false);
                          setArama("");
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-nova-500/15"
                      >
                        <span>{u.name}</span>
                        <span className="text-xs text-slate-500">Stok: {u.stock_quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Miktar</label>
            <input
              type="number"
              step="1"
              min="1"
              value={miktar}
              onChange={(e) => setMiktar(e.target.value)}
              className="w-20 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-nova-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={sokulenVar}
              onChange={(e) => setSokulenVar(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 bg-surface text-nova-500 focus:ring-0"
            />
            Bu bir değişim — sökülen eski parça var
          </label>

          {sokulenVar && (
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={akibet}
                onChange={(e) => setAkibet(e.target.value)}
                className="rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-nova-500"
              >
                {Object.entries(SOKULEN_PARCA_AKIBETI).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Not (opsiyonel)"
                className={alanSinifi}
              />
            </div>
          )}

          {hata && <p className="text-xs text-red-300">{hata}</p>}

          <button
            onClick={parcaEkle}
            disabled={!secili || ekleniyor}
            className="rounded-lg bg-nova-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-nova-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ekleniyor ? "Ekleniyor…" : "+ Parça Ekle (Rezerve Et)"}
          </button>
        </div>
      )}

      {parcalar.length === 0 ? (
        <p className="mt-4 text-center text-xs text-slate-600">Henüz parça eklenmedi.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {parcalar.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-slate-800 bg-surface px-3.5 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">
                    {p.urunAdi} <span className="text-slate-500">× {p.quantity}</span>
                  </p>
                  {p.removed_part_disposition && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      🔁 Sökülen parça: {SOKULEN_PARCA_AKIBETI[p.removed_part_disposition]}
                      {p.removed_part_note ? ` — ${p.removed_part_note}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      p.status === "consumed"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {p.status === "consumed" ? "✓ Stoktan Düşüldü" : "Rezerve"}
                  </span>
                  {yetkili && p.status === "reserved" && (
                    <button
                      onClick={() => onayla(p)}
                      disabled={onaylananId === p.id}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {onaylananId === p.id ? "…" : "✓ Onayla"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
