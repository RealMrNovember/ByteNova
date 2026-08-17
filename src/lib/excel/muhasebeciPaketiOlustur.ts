import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { kasaHareketEtiket } from "@/lib/kasa";
import { GIDER_KATEGORILERI } from "@/lib/gider";

const BASLIK_STILI: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF0891B2" } },
};

function baslikSatiriUygula(sheet: ExcelJS.Worksheet) {
  sheet.getRow(1).eachCell((cell) => {
    cell.style = BASLIK_STILI;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

/** Ay (YYYY-MM) için Türkiye saatine göre [başlangıç, bitiş) ISO aralığını döner. */
function ayAraligi(ay: string): { baslangic: string; bitis: string } {
  const [yil, ayNo] = ay.split("-").map(Number);
  const baslangic = new Date(`${ay}-01T00:00:00+03:00`);
  const sonrakiAy = ayNo === 12 ? `${yil + 1}-01` : `${yil}-${String(ayNo + 1).padStart(2, "0")}`;
  const bitis = new Date(`${sonrakiAy}-01T00:00:00+03:00`);
  return { baslangic: baslangic.toISOString(), bitis: bitis.toISOString() };
}

export async function muhasebeciPaketiOlustur(supabase: SupabaseClient, tenantId: string, ay: string) {
  const { baslangic, bitis } = ayAraligi(ay);

  const [{ data: tenant }, { data: satislar }, { data: giderler }, { data: kasaHareketleri }] = await Promise.all([
    supabase.from("tenants").select("name").eq("id", tenantId).single(),
    supabase
      .from("sales")
      .select("sale_no, created_at, total_amount, discount_amount, payment_method, document_type, receipt_no, customers(name)")
      .gte("created_at", baslangic)
      .lt("created_at", bitis)
      .order("created_at"),
    supabase
      .from("expenses")
      .select("created_at, category, description, amount, cash_accounts(name)")
      .gte("created_at", baslangic)
      .lt("created_at", bitis)
      .order("created_at"),
    supabase
      .from("cash_movements")
      .select("created_at, movement_type, amount, reason, cash_accounts(name)")
      .gte("created_at", baslangic)
      .lt("created_at", bitis)
      .order("created_at"),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "ByteNova";
  wb.created = new Date(baslangic);

  // ---------- ÖZET ----------
  const toplamSatis = (satislar ?? []).reduce((t, s) => t + s.total_amount, 0);
  const toplamGider = (giderler ?? []).reduce((t, g) => t + g.amount, 0);
  const toplamTahsilat = (kasaHareketleri ?? []).filter((h) => h.amount > 0).reduce((t, h) => t + h.amount, 0);
  const toplamOdeme = (kasaHareketleri ?? []).filter((h) => h.amount < 0).reduce((t, h) => t + Math.abs(h.amount), 0);

  const ozet = wb.addWorksheet("Özet");
  ozet.columns = [
    { header: "Kalem", key: "kalem", width: 28 },
    { header: "Tutar (TL)", key: "tutar", width: 18 },
  ];
  ozet.addRows([
    { kalem: "İşletme", tutar: tenant?.name ?? "—" },
    { kalem: "Dönem", tutar: ay },
    { kalem: "Toplam Satış", tutar: toplamSatis },
    { kalem: "Toplam Satış İskontosu", tutar: (satislar ?? []).reduce((t, s) => t + s.discount_amount, 0) },
    { kalem: "Satış Adedi", tutar: (satislar ?? []).length },
    { kalem: "Toplam Gider", tutar: toplamGider },
    { kalem: "Gider Kalemi Adedi", tutar: (giderler ?? []).length },
    { kalem: "Kasaya Giren (Tahsilat)", tutar: toplamTahsilat },
    { kalem: "Kasadan Çıkan (Ödeme)", tutar: toplamOdeme },
  ]);
  baslikSatiriUygula(ozet);

  // ---------- SATIŞLAR ----------
  const satisSheet = wb.addWorksheet("Satışlar");
  satisSheet.columns = [
    { header: "Satış No", key: "no", width: 18 },
    { header: "Tarih", key: "tarih", width: 18 },
    { header: "Müşteri", key: "musteri", width: 24 },
    { header: "Tutar (TL)", key: "tutar", width: 14 },
    { header: "İskonto (TL)", key: "iskonto", width: 14 },
    { header: "Ödeme Yöntemi", key: "odeme", width: 16 },
    { header: "Belge", key: "belge", width: 18 },
  ];
  for (const s of satislar ?? []) {
    const musteri = s.customers as unknown as { name: string } | null;
    satisSheet.addRow({
      no: s.sale_no,
      tarih: new Date(s.created_at).toLocaleString("tr-TR"),
      musteri: musteri?.name ?? "Perakende",
      tutar: s.total_amount,
      iskonto: s.discount_amount,
      odeme: s.payment_method,
      belge: s.document_type === "okc_fisi" ? `ÖKC Fişi ${s.receipt_no ?? ""}` : "Sonra kesilecek",
    });
  }
  baslikSatiriUygula(satisSheet);

  // ---------- GİDERLER ----------
  const giderSheet = wb.addWorksheet("Giderler");
  giderSheet.columns = [
    { header: "Tarih", key: "tarih", width: 18 },
    { header: "Kategori", key: "kategori", width: 18 },
    { header: "Açıklama", key: "aciklama", width: 30 },
    { header: "Tutar (TL)", key: "tutar", width: 14 },
    { header: "Kasa Hesabı", key: "hesap", width: 18 },
  ];
  for (const g of giderler ?? []) {
    const hesap = g.cash_accounts as unknown as { name: string } | null;
    giderSheet.addRow({
      tarih: new Date(g.created_at).toLocaleString("tr-TR"),
      kategori: GIDER_KATEGORILERI[g.category]?.etiket ?? g.category,
      aciklama: g.description ?? "",
      tutar: g.amount,
      hesap: hesap?.name ?? "—",
    });
  }
  baslikSatiriUygula(giderSheet);

  // ---------- KASA HAREKETLERİ ----------
  const kasaSheet = wb.addWorksheet("Kasa Hareketleri");
  kasaSheet.columns = [
    { header: "Tarih", key: "tarih", width: 18 },
    { header: "Hesap", key: "hesap", width: 18 },
    { header: "Tip", key: "tip", width: 18 },
    { header: "Tutar (TL)", key: "tutar", width: 14 },
    { header: "Açıklama", key: "aciklama", width: 30 },
  ];
  for (const h of kasaHareketleri ?? []) {
    const hesap = h.cash_accounts as unknown as { name: string } | null;
    kasaSheet.addRow({
      tarih: new Date(h.created_at).toLocaleString("tr-TR"),
      hesap: hesap?.name ?? "—",
      tip: kasaHareketEtiket(h.movement_type),
      tutar: h.amount,
      aciklama: h.reason ?? "",
    });
  }
  baslikSatiriUygula(kasaSheet);

  const buffer = await wb.xlsx.writeBuffer();
  const dosyaAdi = `ByteNova-Muhasebe-${ay}.xlsx`;

  return { buffer, dosyaAdi };
}
