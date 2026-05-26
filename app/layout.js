import "./globals.css";
import { Noto_Sans_TC, Noto_Serif_TC, Instrument_Serif } from "next/font/google";

const notoSansTC = Noto_Sans_TC({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-tc",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata = {
  title: "Stroll-Taipei",
  description: "台北單日散策路線產生器",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSansTC.variable} ${notoSerifTC.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
