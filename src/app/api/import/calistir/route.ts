import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { yetkiVar } from "@/lib/yetki";
import { GECERLI_CIHAZ_TURLERI } from "@/lib/import";

type Satir = Record<string, string | number | null>;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { data: profil } = await supabase.from("profiles").select("tenant_id, role").eq("id", user.id).single();
  if (!profil?.tenant_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 403 });

  const body = await request.json();
  const tur = body.tur as string;
  const satirlar = body.satirlar as Satir[];

  if (!["musteri", "urun", "cihaz", "servis"].includes(tur) || !Array.isArray(satirlar)) {
    return NextResponse.json({ hata: "Geçersiz istek" }, { status: 400 });
  }

  // Yetki kontrolü — modül bazlı, mevcut sayfa gösterme yetkileriyle aynı.
  // (Müşteri içe aktarımı için ayrı bir yetki anahtarı yok — tüm roller müşteri
  // oluşturabildiğinden burada da serbest bırakıldı.)
  if (tur === "urun" && !yetkiVar(profil.role, "stok_yonet")) {
    return NextResponse.json({ hata: "Bu içe aktarma için yetkiniz yok" }, { status: 403 });
  }
  if ((tur === "cihaz" || tur === "servis") && !yetkiVar(profil.role, "servis_yonet")) {
    return NextResponse.json({ hata: "Bu içe aktarma için yetkiniz yok" }, { status: 403 });
  }

  const tenantId = profil.tenant_id;
  const sonuclar: { satir: number; ok: boolean; mesaj?: string }[] = [];
  let basarili = 0;

  if (tur === "musteri") {
    for (let i = 0; i < satirlar.length; i++) {
      const s = satirlar[i];
      const ad = String(s.name ?? "").trim();
      if (!ad) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: "Ad zorunlu" });
        continue;
      }
      const { error } = await supabase.from("customers").insert({
        tenant_id: tenantId,
        name: ad,
        phone: s.phone ? String(s.phone).trim() : null,
        email: s.email ? String(s.email).trim() : null,
        address: s.address ? String(s.address).trim() : null,
        tax_office: s.tax_office ? String(s.tax_office).trim() : null,
        tax_number: s.tax_number ? String(s.tax_number).trim() : null,
        notes: s.notes ? String(s.notes).trim() : null,
      });
      if (error) sonuclar.push({ satir: i + 1, ok: false, mesaj: "Kaydedilemedi" });
      else {
        sonuclar.push({ satir: i + 1, ok: true });
        basarili++;
      }
    }
  } else if (tur === "urun") {
    for (let i = 0; i < satirlar.length; i++) {
      const s = satirlar[i];
      const ad = String(s.name ?? "").trim();
      if (!ad) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: "Ürün adı zorunlu" });
        continue;
      }
      const { error } = await supabase.from("products").insert({
        tenant_id: tenantId,
        name: ad,
        sku: s.sku ? String(s.sku).trim() : null,
        barcode: s.barcode ? String(s.barcode).trim() : null,
        brand: s.brand ? String(s.brand).trim() : null,
        purchase_price: s.purchase_price ? Number(s.purchase_price) || null : null,
        sale_price: s.sale_price ? Number(s.sale_price) || null : null,
        stock_quantity: s.stock_quantity ? Number(s.stock_quantity) || 0 : 0,
        critical_stock: s.critical_stock ? Number(s.critical_stock) || 0 : 0,
      });
      if (error) sonuclar.push({ satir: i + 1, ok: false, mesaj: error.message.includes("unique") ? "Barkod/SKU zaten kayıtlı" : "Kaydedilemedi" });
      else {
        sonuclar.push({ satir: i + 1, ok: true });
        basarili++;
      }
    }
  } else if (tur === "cihaz") {
    for (let i = 0; i < satirlar.length; i++) {
      const s = satirlar[i];
      const telefon = String(s.musteri_telefon ?? "").trim();
      const cihazTuru = String(s.device_type ?? "").trim().toLowerCase();
      if (!telefon) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: "Müşteri telefonu zorunlu" });
        continue;
      }
      if (!GECERLI_CIHAZ_TURLERI.includes(cihazTuru)) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: `Geçersiz cihaz türü: ${cihazTuru}` });
        continue;
      }
      const { data: musteri } = await supabase.from("customers").select("id").eq("phone", telefon).limit(1).maybeSingle();
      if (!musteri) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: `Telefon ile eşleşen müşteri bulunamadı: ${telefon}` });
        continue;
      }
      const { error } = await supabase.from("devices").insert({
        tenant_id: tenantId,
        customer_id: musteri.id,
        device_type: cihazTuru,
        brand: s.brand ? String(s.brand).trim() : null,
        model: s.model ? String(s.model).trim() : null,
        serial_no: s.serial_no ? String(s.serial_no).trim() : null,
      });
      if (error) sonuclar.push({ satir: i + 1, ok: false, mesaj: error.message.includes("unique") ? "Bu seri no zaten kayıtlı" : "Kaydedilemedi" });
      else {
        sonuclar.push({ satir: i + 1, ok: true });
        basarili++;
      }
    }
  } else if (tur === "servis") {
    for (let i = 0; i < satirlar.length; i++) {
      const s = satirlar[i];
      const telefon = String(s.musteri_telefon ?? "").trim();
      const beyan = String(s.declared_issue ?? "").trim();
      if (!telefon || !beyan) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: "Müşteri telefonu ve arıza beyanı zorunlu" });
        continue;
      }
      const { data: musteri } = await supabase.from("customers").select("id").eq("phone", telefon).limit(1).maybeSingle();
      if (!musteri) {
        sonuclar.push({ satir: i + 1, ok: false, mesaj: `Telefon ile eşleşen müşteri bulunamadı: ${telefon}` });
        continue;
      }
      let deviceId: string | null = null;
      const seriNo = s.cihaz_seri_no ? String(s.cihaz_seri_no).trim() : "";
      if (seriNo) {
        const { data: cihaz } = await supabase.from("devices").select("id").eq("serial_no", seriNo).limit(1).maybeSingle();
        deviceId = cihaz?.id ?? null;
      }
      const durum = s.status ? String(s.status).trim() : "kabul_edildi";
      const { error } = await supabase.from("service_orders").insert({
        tenant_id: tenantId,
        customer_id: musteri.id,
        device_id: deviceId,
        declared_issue: beyan,
        status: durum,
        consent_accepted: false,
        created_by: user.id,
      });
      if (error) sonuclar.push({ satir: i + 1, ok: false, mesaj: error.message.includes("check") ? `Geçersiz durum: ${durum}` : "Kaydedilemedi" });
      else {
        sonuclar.push({ satir: i + 1, ok: true });
        basarili++;
      }
    }
  }

  return NextResponse.json({ toplam: satirlar.length, basarili, sonuclar });
}
