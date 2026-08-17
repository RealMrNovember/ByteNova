import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ServisBelgesi } from "./ServisBelgesi";
import { MusteriEkstresi } from "./MusteriEkstresi";
import { TedarikciEkstresi } from "./TedarikciEkstresi";
import { TeklifBelgesi } from "./TeklifBelgesi";
import { GiderPusulasiBelgesi } from "./GiderPusulasiBelgesi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bytenova.cicibyte.com";

export async function servisPdfOlustur(
  supabase: SupabaseClient,
  servisId: string,
  tipIstek?: "kabul" | "teslim"
) {
  const { data: servis } = await supabase
    .from("service_orders")
    .select(
      "*, customers(name, phone, address), devices(device_type, brand, model, serial_no)"
    )
    .eq("id", servisId)
    .maybeSingle();

  if (!servis) return null;

  const tip =
    tipIstek ?? (servis.status === "teslim_edildi" ? "teslim" : "kabul");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, phone, address")
    .eq("id", servis.tenant_id)
    .single();

  const qrDataUrl = await QRCode.toDataURL(servis.service_no, {
    margin: 1,
    width: 200,
  });

  const buffer = await renderToBuffer(
    ServisBelgesi({
      tip,
      servis,
      musteri: servis.customers ?? { name: "—", phone: null },
      cihaz: servis.devices,
      isletme: tenant ?? { name: "İşletmem", phone: null, address: null },
      qrDataUrl,
    })
  );

  const dosyaAdi = `${servis.service_no}-${tip === "kabul" ? "kabul-formu" : "teslim-tutanagi"}.pdf`;

  return { buffer, dosyaAdi, servis, tip };
}

export async function teklifPdfOlustur(supabase: SupabaseClient, teklifId: string) {
  const { data: teklif } = await supabase
    .from("quotes")
    .select("*, customers(name, phone), tenants(name, phone, address)")
    .eq("id", teklifId)
    .maybeSingle();

  if (!teklif) return null;

  const { data: kalemler } = await supabase
    .from("quote_items")
    .select("name, quantity, unit_price, discount_amount, line_total")
    .eq("quote_id", teklifId)
    .order("id");

  const onayUrl = `${SITE_URL}/teklif-onay/${teklif.public_token}`;
  const qrDataUrl = await QRCode.toDataURL(onayUrl, { margin: 1, width: 200 });

  const buffer = await renderToBuffer(
    TeklifBelgesi({
      teklif,
      musteri: teklif.customers ?? { name: "—", phone: null },
      isletme: teklif.tenants ?? { name: "İşletmem", phone: null, address: null },
      kalemler: kalemler ?? [],
      qrDataUrl,
    })
  );

  const dosyaAdi = `${teklif.quote_no}-teklif.pdf`;

  return { buffer, dosyaAdi, teklif };
}

export async function giderPusulasiPdfOlustur(supabase: SupabaseClient, belgeId: string) {
  const { data: belge } = await supabase
    .from("e_document_records")
    .select("*, suppliers(name, phone, address), tenants(name, phone, address)")
    .eq("id", belgeId)
    .eq("document_type", "gider_pusulasi")
    .maybeSingle();

  if (!belge) return null;

  const buffer = await renderToBuffer(
    GiderPusulasiBelgesi({
      belge,
      tedarikci: belge.suppliers ?? { name: "—", phone: null, address: null },
      isletme: belge.tenants ?? { name: "İşletmem", phone: null, address: null },
    })
  );

  const dosyaAdi = `${belge.document_no}-gider-pusulasi.pdf`;

  return { buffer, dosyaAdi, belge };
}

export async function musteriEkstrePdfOlustur(supabase: SupabaseClient, musteriId: string) {
  const { data: musteri } = await supabase
    .from("customers")
    .select("id, name, phone, balance, tenant_id")
    .eq("id", musteriId)
    .maybeSingle();

  if (!musteri) return null;

  const [{ data: tenant }, { data: hareketler }] = await Promise.all([
    supabase.from("tenants").select("name, phone, address").eq("id", musteri.tenant_id).single(),
    supabase
      .from("customer_ledger")
      .select("entry_type, amount, balance_after, description, created_at")
      .eq("customer_id", musteriId)
      .order("created_at"),
  ]);

  const buffer = await renderToBuffer(
    MusteriEkstresi({
      musteri,
      isletme: tenant ?? { name: "İşletmem", phone: null, address: null },
      hareketler: hareketler ?? [],
    })
  );

  const dosyaAdi = `${musteri.name.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g, "-")}-ekstre.pdf`;

  return { buffer, dosyaAdi };
}

export async function tedarikciEkstrePdfOlustur(supabase: SupabaseClient, tedarikciId: string) {
  const { data: tedarikci } = await supabase
    .from("suppliers")
    .select("id, name, phone, currency, balance, tenant_id")
    .eq("id", tedarikciId)
    .maybeSingle();

  if (!tedarikci) return null;

  const [{ data: tenant }, { data: hareketler }] = await Promise.all([
    supabase.from("tenants").select("name, phone, address").eq("id", tedarikci.tenant_id).single(),
    supabase
      .from("supplier_ledger")
      .select("entry_type, amount, amount_try, balance_after, description, created_at")
      .eq("supplier_id", tedarikciId)
      .order("created_at"),
  ]);

  const buffer = await renderToBuffer(
    TedarikciEkstresi({
      tedarikci,
      isletme: tenant ?? { name: "İşletmem", phone: null, address: null },
      hareketler: hareketler ?? [],
    })
  );

  const dosyaAdi = `${tedarikci.name.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g, "-")}-ekstre.pdf`;

  return { buffer, dosyaAdi };
}
