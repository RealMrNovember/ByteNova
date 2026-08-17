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
  etiket: { width: 90, color: "#666" },
  deger: { flex: 1, fontWeight: 700 },
  kutu: { border: "1 solid #ddd", borderRadius: 4, padding: 8, backgroundColor: "#fafafa" },
  ozetKutu: {
    border: "1 solid #0891b2",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#ecfeff",
    alignItems: "flex-end",
  },
  ozetEtiket: { fontSize: 8, color: "#0e7490", textTransform: "uppercase" },
  ozetDeger: { fontSize: 16, fontWeight: 700, color: "#0e2a3a", marginTop: 2 },
  tabloBaslik: { flexDirection: "row", borderBottom: "1 solid #0891b2", paddingBottom: 4, marginBottom: 2 },
  tabloBaslikHucre: { fontSize: 7.5, fontWeight: 700, color: "#0891b2", textTransform: "uppercase" },
  tabloSatir: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 4 },
  tabloHucre: { fontSize: 8.5 },
  colTarih: { width: 65 },
  colAciklama: { flex: 1, paddingRight: 6 },
  colTutar: { width: 65, textAlign: "right" },
  colBakiye: { width: 80, textAlign: "right", fontWeight: 700 },
  altBilgi: { position: "absolute", bottom: 30, left: 36, right: 36 },
});

type Tedarikci = { name: string; phone: string | null; currency: string; balance: number };
type Isletme = { name: string; phone: string | null; address: string | null };
type Hareket = {
  entry_type: string;
  amount: number | null;
  amount_try: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};

const ENTRY_ETIKET: Record<string, string> = {
  alis_borc: "Alış borcu",
  odeme: "Ödeme",
  kur_farki: "Kur farkı",
  duzeltme: "Düzeltme",
  acilis_bakiyesi: "Açılış bakiyesi (devir)",
};

const tarih = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function TedarikciEkstresi({
  tedarikci,
  isletme,
  hareketler,
}: {
  tedarikci: Tedarikci;
  isletme: Isletme;
  hareketler: Hareket[];
}) {
  return (
    <Document title={`${tedarikci.name} — Cari Ekstre`}>
      <Page size="A4" style={s.page}>
        <View style={s.ustBaslik}>
          <View>
            <Text style={s.isletmeAdi}>{isletme.name}</Text>
            {isletme.phone && <Text style={s.isletmeSatir}>{isletme.phone}</Text>}
            {isletme.address && <Text style={s.isletmeSatir}>{isletme.address}</Text>}
          </View>
          <View>
            <Text style={s.belgeBaslik}>TEDARİKÇİ CARİ EKSTRE</Text>
            <Text style={s.belgeAltBaslik}>
              Düzenlenme: {tarih(new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 14, gap: 10 }}>
          <View style={[s.bolum, { flex: 1, marginBottom: 0 }]}>
            <Text style={s.bolumBaslik}>Tedarikçi</Text>
            <View style={s.kutu}>
              <View style={s.satir}>
                <Text style={s.etiket}>Ad</Text>
                <Text style={s.deger}>{tedarikci.name}</Text>
              </View>
              {tedarikci.phone && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Telefon</Text>
                  <Text style={s.deger}>{tedarikci.phone}</Text>
                </View>
              )}
              <View style={s.satir}>
                <Text style={s.etiket}>Para Birimi</Text>
                <Text style={s.deger}>{tedarikci.currency}</Text>
              </View>
            </View>
          </View>
          <View style={s.ozetKutu}>
            <Text style={s.ozetEtiket}>Güncel Bakiye</Text>
            <Text style={s.ozetDeger}>
              {tedarikci.balance.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {tedarikci.currency}
            </Text>
          </View>
        </View>

        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Hareketler</Text>
          <View style={s.tabloBaslik}>
            <Text style={[s.tabloBaslikHucre, s.colTarih]}>Tarih</Text>
            <Text style={[s.tabloBaslikHucre, s.colAciklama]}>Açıklama</Text>
            <Text style={[s.tabloBaslikHucre, s.colTutar]}>Borç</Text>
            <Text style={[s.tabloBaslikHucre, s.colTutar]}>Ödeme</Text>
            <Text style={[s.tabloBaslikHucre, s.colBakiye]}>Bakiye</Text>
          </View>
          {hareketler.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: "#999", marginTop: 8 }}>
              Bu tedarikçide henüz cari hareket yok.
            </Text>
          ) : (
            hareketler.map((h, i) => (
              <View key={i} style={s.tabloSatir}>
                <Text style={[s.tabloHucre, s.colTarih]}>{tarih(h.created_at)}</Text>
                <Text style={[s.tabloHucre, s.colAciklama]}>
                  {ENTRY_ETIKET[h.entry_type] ?? h.entry_type}
                  {h.description ? ` — ${h.description}` : ""}
                  {h.entry_type === "kur_farki" &&
                    ` (${h.amount_try > 0 ? "+" : ""}${h.amount_try.toLocaleString("tr-TR")} TL)`}
                </Text>
                <Text style={[s.tabloHucre, s.colTutar]}>
                  {h.amount != null && h.amount > 0 ? h.amount.toLocaleString("tr-TR") : ""}
                </Text>
                <Text style={[s.tabloHucre, s.colTutar]}>
                  {h.amount != null && h.amount < 0 ? Math.abs(h.amount).toLocaleString("tr-TR") : ""}
                </Text>
                <Text style={[s.tabloHucre, s.colBakiye]}>
                  {h.balance_after.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {tedarikci.currency}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={s.altBilgi} fixed>
          <Text style={{ fontSize: 7, color: "#999", textAlign: "center" }}>
            {tedarikci.name} · Düzenlenme: {tarih(new Date().toISOString())} · ByteNova ile oluşturulmuştur
          </Text>
        </View>
      </Page>
    </Document>
  );
}
