import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5/files/roboto-latin-400-normal.woff" },
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5/files/roboto-latin-700-normal.woff", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: "Roboto", fontSize: 9.5, color: "#1a1a1a" },
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
  belgeAltBaslik: { fontSize: 10, color: "#0891b2", textAlign: "right", marginTop: 3 },
  bolum: { marginBottom: 14 },
  bolumBaslik: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0891b2",
    textTransform: "uppercase",
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  satir: { flexDirection: "row", marginBottom: 3 },
  etiket: { width: 100, color: "#666" },
  deger: { flex: 1, fontWeight: 700 },
  kutu: { border: "1 solid #ddd", borderRadius: 4, padding: 8, backgroundColor: "#fafafa" },
  ozetKutu: { alignSelf: "flex-end", width: 240, marginTop: 8 },
  ozetSatir: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  ozetToplamSatir: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #0891b2",
    paddingTop: 5,
    marginTop: 3,
  },
  imzaAlani: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  imzaKutu: { width: 200, borderTop: "1 solid #999", paddingTop: 4, textAlign: "center", fontSize: 8, color: "#666" },
  altBilgi: { position: "absolute", bottom: 30, left: 36, right: 36 },
});

type Isletme = { name: string; phone: string | null; address: string | null };
type Tedarikci = { name: string; address: string | null; phone: string | null };
type Belge = {
  document_no: string;
  description: string | null;
  amount: number;
  withholding_rate: number | null;
  withholding_amount: number | null;
  net_amount: number | null;
  created_at: string;
};

const tarih = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
const para = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;

export function GiderPusulasiBelgesi({
  belge,
  tedarikci,
  isletme,
}: {
  belge: Belge;
  tedarikci: Tedarikci;
  isletme: Isletme;
}) {
  return (
    <Document title={`${belge.document_no} — Gider Pusulası`}>
      <Page size="A4" style={s.page}>
        <View style={s.ustBaslik}>
          <View>
            <Text style={s.isletmeAdi}>{isletme.name}</Text>
            {isletme.phone && <Text style={s.isletmeSatir}>{isletme.phone}</Text>}
            {isletme.address && <Text style={s.isletmeSatir}>{isletme.address}</Text>}
          </View>
          <View>
            <Text style={s.belgeBaslik}>GİDER PUSULASI</Text>
            <Text style={s.belgeAltBaslik}>{belge.document_no}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 14, gap: 10 }}>
          <View style={[s.bolum, { flex: 1, marginBottom: 0 }]}>
            <Text style={s.bolumBaslik}>Satıcı (Vergi Mükellefi Olmayan)</Text>
            <View style={s.kutu}>
              <View style={s.satir}>
                <Text style={s.etiket}>Ad Soyad</Text>
                <Text style={s.deger}>{tedarikci.name}</Text>
              </View>
              {tedarikci.phone && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Telefon</Text>
                  <Text style={s.deger}>{tedarikci.phone}</Text>
                </View>
              )}
              {tedarikci.address && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Adres</Text>
                  <Text style={s.deger}>{tedarikci.address}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[s.bolum, { flex: 1, marginBottom: 0 }]}>
            <Text style={s.bolumBaslik}>Belge Bilgisi</Text>
            <View style={s.kutu}>
              <View style={s.satir}>
                <Text style={s.etiket}>Düzenlenme</Text>
                <Text style={s.deger}>{tarih(belge.created_at)}</Text>
              </View>
              <View style={s.satir}>
                <Text style={s.etiket}>Belge No</Text>
                <Text style={s.deger}>{belge.document_no}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Alınan Mal / Hizmet</Text>
          <View style={s.kutu}>
            <Text style={{ fontSize: 9.5 }}>{belge.description ?? "—"}</Text>
          </View>

          <View style={s.ozetKutu}>
            <View style={s.ozetSatir}>
              <Text style={{ fontSize: 8.5, color: "#666" }}>Brüt Tutar</Text>
              <Text style={{ fontSize: 8.5 }}>{para(belge.amount)}</Text>
            </View>
            {!!belge.withholding_amount && belge.withholding_amount > 0 && (
              <View style={s.ozetSatir}>
                <Text style={{ fontSize: 8.5, color: "#666" }}>
                  Stopaj (%{belge.withholding_rate})
                </Text>
                <Text style={{ fontSize: 8.5 }}>-{para(belge.withholding_amount)}</Text>
              </View>
            )}
            <View style={s.ozetToplamSatir}>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>NET ÖDENEN</Text>
              <Text style={{ fontSize: 11, fontWeight: 700, color: "#0e2a3a" }}>
                {para(belge.net_amount ?? belge.amount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.imzaAlani}>
          <Text style={s.imzaKutu}>Satıcı İmzası</Text>
          <Text style={s.imzaKutu}>Yetkili İmzası</Text>
        </View>

        <View style={s.altBilgi} fixed>
          <Text style={{ fontSize: 7, color: "#999", textAlign: "center" }}>
            {belge.document_no} · Düzenlenme: {tarih(belge.created_at)} · ByteNova ile oluşturulmuştur
          </Text>
        </View>
      </Page>
    </Document>
  );
}
