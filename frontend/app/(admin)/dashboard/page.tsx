import Link from "next/link";
import type { ReactNode } from "react";

import { getAdminStats } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "管理ダッシュボード" };

function Stat({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const content = (
    <div
      className={cn(
        "h-full border border-line bg-surface p-5",
        href && "transition-colors hover:border-accent",
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function DashboardPage() {
  const s = await getAdminStats();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">管理ダッシュボード</h1>
      <p className="mt-2 text-ink-muted">サークル運営のサマリです。</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="メンバー" value={s.members} href="/dashboard/members" />
        <Stat label="管理者" value={s.admins} />
        <Stat label="公開イベント" value={s.published} href="/dashboard/events" />
        <Stat label="今後の予定" value={s.upcoming} />
        <Stat label="出席率" value={s.attendanceRate != null ? `${s.attendanceRate}%` : "—"} />
        <Stat label="未対応の申込" value={s.pendingReq} href="/dashboard/requests" />
        <Stat label="未対応の問い合わせ" value={s.pendingContact} href="/dashboard/requests" />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/dashboard/events"
          className="border border-accent bg-accent px-4 py-2 text-sm text-accent-fg hover:bg-accent-hover"
        >
          イベントを作成・管理
        </Link>
        <Link
          href="/dashboard/requests"
          className="border border-line px-4 py-2 text-sm hover:border-ink"
        >
          申込・問い合わせ
        </Link>
        <Link
          href="/dashboard/members"
          className="border border-line px-4 py-2 text-sm hover:border-ink"
        >
          メンバー管理
        </Link>
      </div>
    </main>
  );
}
