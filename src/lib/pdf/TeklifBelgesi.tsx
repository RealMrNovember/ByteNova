import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";

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
  qr: { width: 64, height: 64, position: "absolute", top: 0, right: 0 },
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
  tabloBaslik: { flexDirection: "row", borderBottom: "1 solid #0891b2", paddingBottom: 4, marginBottom: 2 },
  tabloBaslikHucre: { fontSize: 7.5, fontWeight: 700, color: "#0891b2", textTransform: "uppercase" },
  tabloSatir: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 4 },
  tabloHucre: { fontSize: 8.5 },
  colAd: { flex: 1, paddingRight: 6 },
  colMiktar: { width: 45, textAlign: "right" },
  colFiyat: { width: 70, textAlign: "right" },
  colToplam: { width: 75, textAlign: "right", fontWeight: 700 },
  ozetKutu: { alignSelf: "flex-end", width: 220, marginTop: 8 },
  ozetSatir: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  ozetToplamSatir: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #0891b2",
    paddingTop: 5,
    marginTop: 3,
  },
  altBilgi: { position: "absolute", bottom: 30, left: 36, right: 36 },
});

type Kalem = { name: string; quantity: number; unit_price: number; discount_amount: number; line_total: number };
type Isletme = { name: string; phone: string | null; address: string | null };
type Musteri = { name: string; phone: string | null };
type Teklif = {
  quote_no: string;
  currency: string;
  exchange_rate: number | null;
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  note: string | null;
  created_at: string;
};

const tarih = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function TeklifBelgesi({
  teklif,
  musteri,
  isletme,
  kalemler,
  qrDataUrl,
}: {
  teklif: Teklif;
  musteri: Musteri;
  isletme: Isletme;
  kalemler: Kalem[];
  qrDataUrl: string;
}) {
  const para = (n: number) =>
    `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${teklif.currency === "TRY" ? "₺" : teklif.currency}`;

  return (
    <Document title={`${teklif.quote_no} — Teklif`}>
      <Page size="A4" style={s.page}>
        <View style={s.ustBaslik}>
          <View>
            <Text style={s.isletmeAdi}>{isletme.name}</Text>
            {isletme.phone && <Text style={s.isletmeSatir}>{isletme.phone}</Text>}
            {isletme.address && <Text style={s.isletmeSatir}>{isletme.address}</Text>}
          </View>
          <View>
            <Text style={s.belgeBaslik}>FİYAT TEKLİFİ</Text>
            <Text style={s.belgeAltBaslik}>{teklif.quote_no}</Text>
          </View>
          <Image src={qrDataUrl} style={s.qr} />
        </View>

        <View style={{ flexDirection: "row", marginBottom: 14, gap: 10 }}>
          <View style={[s.bolum, { flex: 1, marginBottom: 0 }]}>
            <Text style={s.bolumBaslik}>Müşteri</Text>
            <View style={s.kutu}>
              <View style={s.satir}>
                <Text style={s.etiket}>Ad / Unvan</Text>
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
          <View style={[s.bolum, { flex: 1, marginBottom: 0 }]}>
            <Text style={s.bolumBaslik}>Teklif Bilgisi</Text>
            <View style={s.kutu}>
              <View style={s.satir}>
                <Text style={s.etiket}>Düzenlenme</Text>
                <Text style={s.deger}>{tarih(teklif.created_at)}</Text>
              </View>
              <View style={s.satir}>
                <Text style={s.etiket}>Geçerlilik</Text>
                <Text style={s.deger}>{tarih(teklif.valid_until)}</Text>
              </View>
              {teklif.currency !== "TRY" && teklif.exchange_rate && (
                <View style={s.satir}>
                  <Text style={s.etiket}>Kur</Text>
                  <Text style={s.deger}>
                    1 {teklif.currency} = {teklif.exchange_rate.toLocaleString("tr-TR")} ₺
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Kalemler</Text>
          <View style={s.tabloBaslik}>
            <Text style={[s.tabloBaslikHucre, s.colAd]}>Açıklama</Text>
            <Text style={[s.tabloBaslikHucre, s.colMiktar]}>Miktar</Text>
            <Text style={[s.tabloBaslikHucre, s.colFiyat]}>Birim Fiyat</Text>
            <Text style={[s.tabloBaslikHucre, s.colToplam]}>Tutar</Text>
          </View>
          {kalemler.map((k, i) => (
            <View key={i} style={s.tabloSatir}>
              <Text style={[s.tabloHucre, s.colAd]}>{k.name}</Text>
              <Text style={[s.tabloHucre, s.colMiktar]}>{k.quantity}</Text>
              <Text style={[s.tabloHucre, s.colFiyat]}>{para(k.unit_price)}</Text>
              <Text style={[s.tabloHucre, s.colToplam]}>{para(k.line_total)}</Text>
            </View>
          ))}

          <View style={s.ozetKutu}>
            <View style={s.ozetSatir}>
              <Text style={{ fontSize: 8.5, color: "#666" }}>Ara Toplam</Text>
              <Text style={{ fontSize: 8.5 }}>{para(teklif.subtotal)}</Text>
            </View>
            {teklif.discount_amount > 0 && (
              <View style={s.ozetSatir}>
                <Text style={{ fontSize: 8.5, color: "#666" }}>Genel İskonto</Text>
                <Text style={{ fontSize: 8.5 }}>-{para(teklif.discount_amount)}</Text>
              </View>
            )}
            <View style={s.ozetToplamSatir}>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>TOPLAM</Text>
              <Text style={{ fontSize: 11, fontWeight: 700, color: "#0e2a3a" }}>{para(teklif.total_amount)}</Text>
            </View>
          </View>
        </View>

        {teklif.note && (
          <View style={s.bolum}>
            <Text style={s.bolumBaslik}>Not</Text>
            <Text style={{ fontSize: 8.5, color: "#444" }}>{teklif.note}</Text>
          </View>
        )}

        <Text style={{ fontSize: 8, color: "#0891b2", marginTop: 4 }}>
          Bu teklifi görüntülemek ve online onaylamak için yukarıdaki QR kodu okutabilirsiniz.
        </Text>

        <View style={s.altBilgi} fixed>
          <Text style={{ fontSize: 7, color: "#999", textAlign: "center" }}>
            {teklif.quote_no} · Düzenlenme: {tarih(teklif.created_at)} · ByteNova ile oluşturulmuştur
          </Text>
        </View>
      </Page>
    </Document>
  );
}
