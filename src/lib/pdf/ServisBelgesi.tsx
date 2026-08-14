import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { durumEtiket } from "@/lib/servis";
import { cihazEtiket } from "@/lib/cihaz";

// Türkçe karakterler için Helvetica yerine geniş kapsamlı bir yazı tipi
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5/files/roboto-latin-400-normal.woff",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5/files/roboto-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const s = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Roboto",
    fontSize: 9.5,
    color: "#1a1a1a",
  },
  ustBaslik: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2 solid #0891b2",
    paddingBottom: 10,
    marginBottom: 14,
  },
  isletmeAdi: { fontSize: 15, fontWeight: 700, color: "#0e2a3a" },
  isletmeSatir: { fontSize: 8.5, color: "#555", marginTop: 2 },
  belgeBaslik: { fontSize: 13, fontWeight: 700, textAlign: "right" },
  servisNo: {
    fontSize: 11,
    fontFamily: "Courier",
    color: "#0891b2",
    textAlign: "right",
    marginTop: 3,
  },
  bolum: { marginBottom: 12 },
  bolumBaslik: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0891b2",
    textTransform: "uppercase",
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  satir: { flexDirection: "row", marginBottom: 3 },
  etiket: { width: 110, color: "#666" },
  deger: { flex: 1, fontWeight: 700 },
  kutu: {
    border: "1 solid #ddd",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#fafafa",
  },
  checklistGrid: { flexDirection: "row", flexWrap: "wrap" },
  checklistItem: { width: "33%", fontSize: 8.5, marginBottom: 3 },
  aksesuarChip: {
    fontSize: 8.5,
    border: "1 solid #ccc",
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginRight: 5,
    marginBottom: 4,
  },
  aksesuarSatir: { flexDirection: "row", flexWrap: "wrap" },
  beyanMetni: { fontSize: 7.5, color: "#666", lineHeight: 1.5 },
  altBilgi: {
    position: "absolute",
    bottom: 30,
    left: 36,
    right: 36,
  },
  imzaAlani: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  imzaKutu: { width: "45%", borderTop: "1 solid #999", paddingTop: 4 },
  imzaEtiket: { fontSize: 8, color: "#666" },
  qrAlani: { position: "absolute", top: 36, right: 36, alignItems: "center" },
});

type Servis = {
  service_no: string;
  status: string;
  declared_issue: string;
  physical_condition: Record<string, boolean>;
  accessories: { name: string; delivered: boolean }[];
  priority: string;
  created_at: string;
  delivered_at: string | null;
  delivery_note: string | null;
  final_cost: number | null;
  consent_accepted_at: string | null;
};

type Musteri = { name: string; phone: string | null; address?: string | null };
type Cihaz = {
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
};
type Isletme = { name: string; phone: string | null; address: string | null };

const KABUL_BEYANI =
  "Cihazdaki veriler yedeklenmemiştir; veri kaybından işletme sorumlu tutulamaz. Sıvı temaslı veya fiziksel hasarlı cihazlarda işlem sonrası çalışma garantisi verilmez.";

export function ServisBelgesi({
  tip,
  servis,
  musteri,
  cihaz,
  isletme,
  qrDataUrl,
}: {
  tip: "kabul" | "teslim";
  servis: Servis;
  musteri: Musteri;
  cihaz: Cihaz | null;
  isletme: Isletme;
  qrDataUrl: string;
}) {
  const checklistGirisleri = Object.entries(servis.physical_condition ?? {});
  const tarihSaat = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Document
      title={`${servis.service_no} — ${tip === "kabul" ? "Servis Kabul Formu" : "Teslim Tutanağı"}`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.qrAlani}>
          <Image src={qrDataUrl} style={{ width: 56, height: 56 }} />
        </View>

        <View style={s.ustBaslik}>
          <View>
            <Text style={s.isletmeAdi}>{isletme.name}</Text>
            {isletme.phone && <Text style={s.isletmeSatir}>{isletme.phone}</Text>}
            {isletme.address && (
              <Text style={s.isletmeSatir}>{isletme.address}</Text>
            )}
          </View>
          <View>
            <Text style={s.belgeBaslik}>
              {tip === "kabul" ? "SERVİS KABUL FORMU" : "TESLİM TUTANAĞI"}
            </Text>
            <Text style={s.servisNo}>{servis.service_no}</Text>
          </View>
        </View>

        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Müşteri</Text>
          <View style={s.kutu}>
            <View style={s.satir}>
              <Text style={s.etiket}>Ad Soyad</Text>
              <Text style={s.deger}>{musteri.name}</Text>
            </View>
            {musteri.phone && (
              <View style={s.satir}>
                <Text style={s.etiket}>Telefon</Text>
                <Text style={s.deger}>{musteri.phone}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Cihaz</Text>
          <View style={s.kutu}>
            <View style={s.satir}>
              <Text style={s.etiket}>Tür</Text>
              <Text style={s.deger}>
                {cihaz ? cihazEtiket(cihaz.device_type) : "—"}
              </Text>
            </View>
            <View style={s.satir}>
              <Text style={s.etiket}>Marka / Model</Text>
              <Text style={s.deger}>
                {cihaz
                  ? [cihaz.brand, cihaz.model].filter(Boolean).join(" ") || "—"
                  : "—"}
              </Text>
            </View>
            <View style={s.satir}>
              <Text style={s.etiket}>Seri Numarası</Text>
              <Text style={s.deger}>{cihaz?.serial_no ?? "—"}</Text>
            </View>
          </View>
        </View>

        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Müşteri Beyanı (Arıza)</Text>
          <View style={s.kutu}>
            <Text>{servis.declared_issue}</Text>
          </View>
        </View>

        {checklistGirisleri.length > 0 && (
          <View style={s.bolum}>
            <Text style={s.bolumBaslik}>Fiziksel Kabul Kontrolü</Text>
            <View style={s.checklistGrid}>
              {checklistGirisleri.map(([madde, tamam]) => (
                <Text key={madde} style={s.checklistItem}>
                  {tamam ? "[✓]" : "[!]"} {madde}
                </Text>
              ))}
            </View>
          </View>
        )}

        {servis.accessories?.length > 0 && (
          <View style={s.bolum}>
            <Text style={s.bolumBaslik}>
              {tip === "kabul" ? "Teslim Alınan Aksesuarlar" : "Aksesuar Teslim Durumu"}
            </Text>
            <View style={s.aksesuarSatir}>
              {servis.accessories.map((a) => (
                <Text key={a.name} style={s.aksesuarChip}>
                  {tip === "teslim" ? (a.delivered ? "✓ " : "✗ ") : ""}
                  {a.name}
                </Text>
              ))}
            </View>
          </View>
        )}

        {tip === "teslim" && (
          <View style={s.bolum}>
            <Text style={s.bolumBaslik}>Servis Sonucu</Text>
            <View style={s.kutu}>
              <View style={s.satir}>
                <Text style={s.etiket}>Durum</Text>
                <Text style={s.deger}>{durumEtiket(servis.status)}</Text>
              </View>
              {servis.final_cost != null && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Toplam Tutar</Text>
                  <Text style={s.deger}>
                    {servis.final_cost.toLocaleString("tr-TR")} TL
                  </Text>
                </View>
              )}
              {servis.delivery_note && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Teslim Notu</Text>
                  <Text style={s.deger}>{servis.delivery_note}</Text>
                </View>
              )}
              {servis.delivered_at && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Teslim Tarihi</Text>
                  <Text style={s.deger}>{tarihSaat(servis.delivered_at)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <Text style={s.beyanMetni}>
          {KABUL_BEYANI}
          {servis.consent_accepted_at &&
            ` Servis kabul koşulları müşteri huzurunda onaylanmıştır — ${tarihSaat(servis.consent_accepted_at)}.`}
        </Text>

        <View style={s.imzaAlani}>
          <View style={s.imzaKutu}>
            <Text style={s.imzaEtiket}>İşletme Yetkilisi</Text>
          </View>
          <View style={s.imzaKutu}>
            <Text style={s.imzaEtiket}>Müşteri</Text>
          </View>
        </View>

        <View style={s.altBilgi} fixed>
          <Text style={{ fontSize: 7, color: "#999", textAlign: "center" }}>
            {servis.service_no} · Düzenlenme: {tarihSaat(new Date().toISOString())} ·
            ByteNova ile oluşturulmuştur
          </Text>
        </View>
      </Page>
    </Document>
  );
}
