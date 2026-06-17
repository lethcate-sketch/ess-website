import Link from "next/link";
import { notFound } from "next/navigation";

import { AttendanceSummary } from "@/components/admin/AttendanceSummary";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";
import { EventForm } from "@/components/admin/EventForm";
import { getEventWithAttendance } from "@/lib/admin";

export const metadata = { title: "イベント編集" };

export default async function AdminEventEditPage({ params }: { params: { id: string } }) {
  const event = await getEventWithAttendance(params.id);
  if (!event) notFound();

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
アンケート（設問・結果）→
          </Link>
        </div>
        <div className="mt-4">
          <AttendanceSummary
            attendances={event.attendances.map((a) => ({
              id: a.id,
              name: a.user?.name ?? "—",
              status: a.status,
              comment: a.comment,
            }))}
          />
        </div>
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
