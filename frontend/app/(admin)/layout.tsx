import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

// (admin) は middleware が role=ADMIN を要求して保護する（§7）。
// DB直参照・Cookie参照のため動的レンダリングに固定（ビルド時DB接続を避ける）。
export const dynamic = "force-dynamic";

const ADMIN_NAV = [
  { href: "/dashboard", label: "概要" },
  { href: "/dashboard/events", label: "イベント" },
  { href: "/dashboard/about", label: "サークル紹介" },
  { href: "/dashboard/requests", label: "申込・問い合わせ" },
  { href: "/dashboard/members", label: "メンバー" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="border-b border-line bg-surface-muted">
        <nav className="mx-auto flex max-w-content flex-wrap gap-x-5 gap-y-2 px-6 py-3 text-sm">
          <span className="font-mono text-xs uppercase tracking-wide text-accent">Admin</span>
          {ADMIN_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink-muted hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
