import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ja">
      <body className="min-h-screen bg-surface font-sans text-ink">{children}</body>
    </html>
  );
}
