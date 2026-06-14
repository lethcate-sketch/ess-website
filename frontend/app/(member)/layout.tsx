import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

// (member) グループも公開と同じ Header/Footer を共有する。アクセス保護は middleware.ts。
// DB直参照・Cookie参照のため動的レンダリングに固定（ビルド時DB接続を避ける）。
export const dynamic = "force-dynamic";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
