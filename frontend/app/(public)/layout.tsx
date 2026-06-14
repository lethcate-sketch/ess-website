import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

// 公開ページは Prisma で直接DB参照する（§3-5）。ビルド時の静的生成でDBへ接続すると
// Render のビルド環境からは内部DBに到達できず失敗するため、サブツリー全体を動的レンダリングに固定する。
export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
