import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { getAllEvents } from "@/lib/admin";
import { EVENT_STATUS_LABEL, EVENT_TYPE_LABEL } from "@/lib/labels";

export const metadata = { title: "イベント管理" };

export default async function AdminEventsPage() {
  const events = await getAllEvents();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">イベント管理</h1>
        <Link
          href="/dashboard/events/new"
          className="border border-accent bg-accent px-4 py-2 text-sm text-accent-fg hover:bg-accent-hover"
        >
          新規作成
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-muted text-left font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3">開始</th>
              <th className="px-4 py-3">種別</th>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-surface-muted">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3">
                  <DateTime
                    value={e.startAt.toISOString()}
                    dateOnly
                    className="font-mono text-xs text-ink-muted"
                  />
                </td>
                <td className="px-4 py-3 text-ink-muted">{EVENT_TYPE_LABEL[e.type] ?? e.type}</td>
                <td className="px-4 py-3">
                  <Badge tone={e.status === "PUBLISHED" ? "accent" : "muted"}>
                    {EVENT_STATUS_LABEL[e.status] ?? e.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/events/${e.id}`}
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    編集 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-muted">イベントがありません。</p>
        )}
      </div>
    </main>
  );
}
