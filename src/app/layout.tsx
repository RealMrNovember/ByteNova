import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ByteNova — Teknik servisin yeni nesil işletim sistemi",
  description:
    "Bilgisayar mağazaları ve teknik servisler için servis, stok, alış-satış, döviz, e-belge, müşteri, kasa ve raporlamayı tek platformda birleştiren işletme yazılımı.",
  metadataBase: new URL("https://bytenova.cicibyte.com"),
  openGraph: {
    title: "ByteNova",
    description:
      "Servisten satışa, kurdan kasaya — işletmenizin tamamı ByteNova'da.",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-200">
        {children}
      </body>
    </html>
  );
}
