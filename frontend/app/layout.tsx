import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Poppins } from "next/font/google";
import "./globals.css";

// 見出し: Poppins（太め・国際的）。本文(英語): Inter。日本語: Noto Sans JP。
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-jp",
  display: "swap",
  preload: false, // 日本語フォントは大きいため preload しない
});

export const metadata: Metadata = {
  title: {
    default: "ESS — 英語ディスカッションサークル",
    template: "%s | ESS",
  },
  description:
    "ESS（英語ディスカッションサークル）公式サイト。イベント告知・スケジュール・見学/参加申し込み。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${poppins.variable} ${inter.variable} ${notoSansJP.variable}`}
    >
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
