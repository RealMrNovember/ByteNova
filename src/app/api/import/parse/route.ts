import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

function hucreDegeri(v: ExcelJS.CellValue): string | number | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if ("result" in v) return hucreDegeri((v as { result: ExcelJS.CellValue }).result);
    if ("text" in v) return String((v as { text: unknown }).text);
    if ("richText" in v) {
      return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
    }
    return null;
  }
  return v as string | number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const form = await request.formData();
  const dosya = form.get("dosya");
  if (!(dosya instanceof File)) {
    return NextResponse.json({ hata: "Dosya bulunamadı" }, { status: 400 });
  }
  if (dosya.size > 5 * 1024 * 1024) {
    return NextResponse.json({ hata: "Dosya en fazla 5 MB olabilir" }, { status: 400 });
  }

  const buffer = Buffer.from(await dosya.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  try {
    // ExcelJS'in Buffer tip tanımı Node'un güncel Buffer<ArrayBufferLike>
    // ile tam örtüşmüyor (yalnız tip seviyesinde) — çalışma zamanında sorun yok.
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return NextResponse.json(
      { hata: "Dosya okunamadı — geçerli bir .xlsx dosyası olduğundan emin olun" },
      { status: 400 }
    );
  }

  const sheet = wb.worksheets[0];
  if (!sheet) {
    return NextResponse.json({ hata: "Dosyada hiç sayfa bulunamadı" }, { status: 400 });
  }

  const columns: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    columns[colNumber - 1] = String(hucreDegeri(cell.value) ?? "").trim() || `Sütun ${colNumber}`;
  });

  if (columns.length === 0) {
    return NextResponse.json({ hata: "İlk satırda başlık (sütun adı) bulunamadı" }, { status: 400 });
  }

  const rows: Record<string, string | number | null>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string | number | null> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = columns[colNumber - 1];
      if (key) obj[key] = hucreDegeri(cell.value);
    });
    if (Object.values(obj).some((v) => v !== null && v !== "")) {
      rows.push(obj);
    }
  });

  if (rows.length === 0) {
    return NextResponse.json({ hata: "Dosyada aktarılacak veri satırı bulunamadı" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json(
      { hata: `Bu dosyada ${rows.length} satır var — tek seferde en fazla 2000 satır aktarılabilir, dosyayı bölüp tekrar deneyin` },
      { status: 400 }
    );
  }

  return NextResponse.json({ columns, rows });
}
