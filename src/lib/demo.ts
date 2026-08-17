import { createClient as createServiceClient } from "@supabase/supabase-js";

// Showroom'un herkese açık canlı demo hesabı. Kimlik bilgileri bilinçli
// olarak sabit ve kamuya açıktır (kimse kayıt olmadan panele girebilsin
// diye) — bu hesap her gece /api/cron/demo-sifirla tarafından tamamen
// sıfırlanıp yeniden doldurulduğundan gerçek bir güvenlik sınırı taşımaz.
export const DEMO_EMAIL = "demo@bytenova.app";
export const DEMO_PASSWORD = "ByteNovaDemo!2026";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function demoKullaniciIdGetirVeyaOlustur(
  admin: ReturnType<typeof adminClient>
): Promise<string> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Kullanıcı", business_name: "ByteNova Demo İşletmesi" },
  });
  if (!error && created.user) return created.user.id;

  // Zaten varsa (ikinci ve sonraki çalıştırmalar) listeden bul.
  let sayfa = 1;
  for (;;) {
    const { data } = await admin.auth.admin.listUsers({ page: sayfa, perPage: 200 });
    const bulunan = data.users.find((u) => u.email === DEMO_EMAIL);
    if (bulunan) return bulunan.id;
    if (data.users.length < 200) break;
    sayfa++;
  }
  throw new Error("Demo kullanıcısı oluşturulamadı ve bulunamadı: " + JSON.stringify(error));
}

export async function demoTenantiSifirlaVeDoldur() {
  const admin = adminClient();
  const demoKullaniciId = await demoKullaniciIdGetirVeyaOlustur(admin);

  // demoKullaniciId ilk kez oluşturulduysa handle_new_user() tetikleyicisi
  // zaten kendi tenant/profile/branch üçlüsünü yaratmış olur (is_demo=false,
  // boş bir tenant). Sonraki sıfırlamalarda ise profil önceki demo
  // tenant'ına işaret eder. Her iki durumda da tek doğru kaynak profildeki
  // güncel tenant_id'dir — onu silmek (cascade ile) baştan temiz bir tenant
  // kurmamızı sağlar.
  const { data: mevcutProfil } = await admin
    .from("profiles")
    .select("tenant_id")
    .eq("id", demoKullaniciId)
    .maybeSingle();
  if (mevcutProfil?.tenant_id) {
    await admin.from("tenants").delete().eq("id", mevcutProfil.tenant_id);
  }
  // Ek güvenlik: profil bağlantısı kopsa/bozulsa bile is_demo=true
  // işaretli başıboş bir tenant asla kalmasın.
  await admin.from("tenants").delete().eq("is_demo", true);

  const { data: kurumsalPlan } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("key", "kurumsal")
    .single();

  const { data: yeniTenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({
      name: "ByteNova Demo İşletmesi",
      plan_id: kurumsalPlan?.id ?? null,
      billing_cycle: "yillik",
      status: "active",
      onboarding_completed: true,
      is_demo: true,
    })
    .select("id")
    .single();
  if (tenantErr || !yeniTenant) throw new Error("Demo tenant oluşturulamadı: " + tenantErr?.message);
  const tenantId = yeniTenant.id;

  const { error: profilErr } = await admin.from("profiles").insert({
    id: demoKullaniciId,
    tenant_id: tenantId,
    full_name: "Demo Kullanıcı",
    role: "owner",
  });
  if (profilErr) throw new Error("Demo profili oluşturulamadı: " + profilErr.message);

  await admin.from("branches").insert({ tenant_id: tenantId, name: "Merkez", is_default: true });

  await admin.from("tenant_addon_subscriptions").insert([
    { tenant_id: tenantId, addon_key: "kurumsal_satis", status: "active" },
    { tenant_id: tenantId, addon_key: "crm_plus", status: "active" },
  ]);

  const { data: kasa } = await admin
    .from("cash_accounts")
    .insert({ tenant_id: tenantId, name: "Nakit Kasa", type: "nakit" })
    .select("id")
    .single();

  const { data: urunler, error: urunlerErr } = await admin
    .from("products")
    .insert([
      { tenant_id: tenantId, name: "Kingston 16GB DDR4 RAM", brand: "Kingston", sku: "RAM-16GB-DDR4", sale_price: 1450, purchase_price: 1100, stock_quantity: 24, critical_stock: 5, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Samsung 970 EVO 1TB NVMe SSD", brand: "Samsung", sku: "SSD-1TB-NVME", sale_price: 2650, purchase_price: 2100, stock_quantity: 15, critical_stock: 5, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Logitech MX Master 3 Kablosuz Mouse", brand: "Logitech", sku: "MOUSE-MXM3", sale_price: 3200, purchase_price: 2500, stock_quantity: 8, critical_stock: 3, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Dell 24\" FHD Monitör", brand: "Dell", sku: "MON-24-FHD", sale_price: 5400, purchase_price: 4300, stock_quantity: 6, critical_stock: 2, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Laptop Adaptörü 65W Type-C", brand: "Genel", sku: "ADP-65W-TC", sale_price: 650, purchase_price: 420, stock_quantity: 30, critical_stock: 10, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "HDMI Kablo 2m", brand: "Genel", sku: "HDMI-2M", sale_price: 180, purchase_price: 90, stock_quantity: 40, critical_stock: 10, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Termal Macun MX-4", brand: "Arctic", sku: "TERMAL-MX4", sale_price: 350, purchase_price: 220, stock_quantity: 18, critical_stock: 5, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Mekanik Klavye TKL", brand: "Redragon", sku: "KLV-TKL-MEK", sale_price: 2100, purchase_price: 1550, stock_quantity: 3, critical_stock: 4, vat_rate: 20, is_digital: false },
      { tenant_id: tenantId, name: "Windows 11 Pro Dijital Lisans", brand: "Microsoft", sku: "LIC-WIN11PRO", sale_price: 2900, purchase_price: 2200, is_digital: true, critical_stock: 3, vat_rate: 20, stock_quantity: 0 },
    ])
    .select("id, name");
  if (urunlerErr) throw new Error("Demo ürünleri eklenemedi: " + urunlerErr.message);

  const win11Id = urunler?.find((u) => u.name === "Windows 11 Pro Dijital Lisans")?.id;
  if (win11Id) {
    await admin.from("product_license_keys").insert([
      { tenant_id: tenantId, product_id: win11Id, key_value: "DEMO1-WIN11-AAAAA-BBBBB-CCCCC" },
      { tenant_id: tenantId, product_id: win11Id, key_value: "DEMO2-WIN11-DDDDD-EEEEE-FFFFF" },
      { tenant_id: tenantId, product_id: win11Id, key_value: "DEMO3-WIN11-GGGGG-HHHHH-IIIII" },
    ]);
  }

  const { data: musteriler } = await admin
    .from("customers")
    .insert([
      { tenant_id: tenantId, type: "individual", name: "Ahmet Yılmaz", phone: "5551234567", email: "ahmet.yilmaz@example.com" },
      { tenant_id: tenantId, type: "individual", name: "Elif Demir", phone: "5559876543", email: "elif.demir@example.com" },
      { tenant_id: tenantId, type: "individual", name: "Mehmet Kaya", phone: "5554443322" },
      { tenant_id: tenantId, type: "corporate", name: "Nova Ofis Mobilya A.Ş.", phone: "5556667788", email: "info@novaofis.example.com", tax_office: "Kadıköy", tax_number: "1234567890" },
    ])
    .select("id, name");

  const musteriId = (ad: string) => musteriler?.find((m) => m.name === ad)?.id;
  const urunId = (ad: string) => urunler?.find((u) => u.name === ad)?.id;

  const { data: cihazlar } = await admin
    .from("devices")
    .insert([
      { tenant_id: tenantId, customer_id: musteriId("Ahmet Yılmaz"), device_type: "laptop", brand: "Asus", model: "TUF Gaming F15", serial_no: "DEMO-SN-0001" },
      { tenant_id: tenantId, customer_id: musteriId("Elif Demir"), device_type: "desktop", brand: "Casper", model: "Excalibur G750", serial_no: "DEMO-SN-0002" },
      { tenant_id: tenantId, customer_id: musteriId("Mehmet Kaya"), device_type: "phone", brand: "Samsung", model: "Galaxy A54", serial_no: "DEMO-SN-0003" },
    ])
    .select("id, customer_id");

  const cihazId = (musteriAdi: string) =>
    cihazlar?.find((c) => c.customer_id === musteriId(musteriAdi))?.id;

  await admin.from("service_orders").insert([
    {
      tenant_id: tenantId,
      customer_id: musteriId("Ahmet Yılmaz"),
      device_id: cihazId("Ahmet Yılmaz"),
      status: "kabul_edildi",
      priority: "normal",
      declared_issue: "Laptop aşırı ısınıyor ve fan sesi çok yüksek geliyor.",
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
    },
    {
      tenant_id: tenantId,
      customer_id: musteriId("Elif Demir"),
      device_id: cihazId("Elif Demir"),
      status: "onariliyor",
      priority: "yuksek",
      declared_issue: "Masaüstü bilgisayar açılmıyor, güç düğmesine basınca tepki yok.",
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
      technician_id: demoKullaniciId,
      estimated_cost: 850,
    },
    {
      tenant_id: tenantId,
      customer_id: musteriId("Mehmet Kaya"),
      device_id: cihazId("Mehmet Kaya"),
      status: "hazir",
      priority: "normal",
      declared_issue: "Ekran çatlamış, değişim talep edildi.",
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
      technician_id: demoKullaniciId,
      final_cost: 1450,
    },
  ]);

  // satis_olustur/teklif_olustur RPC'leri auth.uid() üzerinden
  // current_tenant_id()/rol_su() çözdüğü için service-role çağrısı
  // yetki kontrolünde başarısız olur — demo kullanıcı olarak gerçek bir
  // oturum açıp normal bir kullanıcı gibi çağırıyoruz.
  const { createClient } = await import("@supabase/supabase-js");
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: oturum } = await anon.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (oturum.session) {
    const demoOlarak = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${oturum.session.access_token}` } } }
    );

    const ramId = urunId("Kingston 16GB DDR4 RAM");
    const ssdId = urunId("Samsung 970 EVO 1TB NVMe SSD");
    if (ramId && ssdId && kasa) {
      await demoOlarak.rpc("satis_olustur", {
        p_musteri_id: musteriId("Ahmet Yılmaz") ?? null,
        p_kalemler: [
          { item_type: "urun", product_id: ramId, name: "Kingston 16GB DDR4 RAM", quantity: 1, unit_price: 1450, discount_amount: 0 },
          { item_type: "urun", product_id: ssdId, name: "Samsung 970 EVO 1TB NVMe SSD", quantity: 1, unit_price: 2650, discount_amount: 0 },
        ],
        p_odemeler: [{ method: "nakit", amount: 4100, installments: null, account_id: kasa.id }],
      });
    }

    const monitorId = urunId('Dell 24" FHD Monitör');
    const kurumsalMusteriId = musteriId("Nova Ofis Mobilya A.Ş.");
    if (monitorId && kurumsalMusteriId) {
      await demoOlarak.rpc("teklif_olustur", {
        p_musteri_id: kurumsalMusteriId,
        p_kalemler: [
          { item_type: "urun", product_id: monitorId, name: 'Dell 24" FHD Monitör', quantity: 5, unit_price: 5400, discount_amount: 0 },
          { item_type: "hizmet", product_id: null, name: "Kurulum ve montaj hizmeti", quantity: 1, unit_price: 1500, discount_amount: 0 },
        ],
        p_not: "Ofis yenileme projesi kapsamında toplu monitör teklifi.",
      });
    }
  }

  return { tenantId };
}
