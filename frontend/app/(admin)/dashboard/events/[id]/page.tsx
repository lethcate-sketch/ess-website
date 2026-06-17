import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteEventButton } from "@/components/admin/DeleteEventButton";
import { EventForm } from "@/components/admin/EventForm";
import { getEventWithAttendance } from "@/lib/admin";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";

export const metadata = { title: "イベント編集" };

const STATUS_KEYS = ["ATTENDING", "LATE", "UNDECIDED", "ABSENT"];

export default async function AdminEventEditPage({ params }: { params: { id: string } }) {
  const event = await getEventWithAttendance(params.id);
  if (!event) notFound();

  const counts: Record<string, number> = { ATTENDING: 0, LATE: 0, UNDECIDED: 0, ABSENT: 0 };
  for (const a of event.attendances) counts[a.status] = (counts[a.status] ?? 0) + 1;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/dashboard/events" className="font-mono text-xs text-ink-muted hover:text-accent">
        ← イベント管理
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">イベント編集</h1>

      <div className="mt-8">
        <EventForm
          initial={{
            id: event.id,
            title: event.title,
            description: event.description,
            type: event.type,
            startAt: event.startAt.toISOString(),
            endAt: event.endAt.toISOString(),
            location: event.location,
            capacity: event.capacity,
            status: event.status,
            isPublic: event.isPublic,
          }}
        />
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">出欠集計（{event.attendances.length} 名回答）</h2>
          <Link
            href={`/dashboard/events/${event.id}/survey`}
            className="font-mono text-xs text-accent hover:underline"
          >
            アンケート結果を見る →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {STATUS_KEYS.map((k) => (
            <div key={k} className="bg-surface p-4 text-center">
              <p className="font-mono text-2xl font-semibold">{counts[k]}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                {ATTENDANCE_STATUS_LABEL[k]}
              </p>
            </div>
          ))}
        </div>
        {event.attendances.length > 0 && (
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
            {event.attendances.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>{a.user?.name ?? "—"}</span>
                <span className="font-mono text-xs text-ink-muted">
                  {ATTENDANCE_STATUS_LABEL[a.status] ?? a.status}
                  {a.comment ? ` ・ ${a.comment}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 border-t border-line pt-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
          危険な操作
        </p>
        <div className="mt-3">
          <DeleteEventButton eventId={event.id} />
        </div>
      </section>
    </main>
  );
}
