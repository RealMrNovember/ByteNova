import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ServisBelgesi } from "./ServisBelgesi";

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
