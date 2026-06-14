import Link from "next/link";

import { AttendanceControl } from "@/components/events/AttendanceControl";
import { DateTime } from "@/components/ui/DateTime";
import { getSession } from "@/lib/auth";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { EVENT_TYPE_LABEL } from "@/lib/labels";
import { getUserAttendanceMap } from "@/lib/members";

export const metadata = { title: "スケジュール" };

export default async function SchedulePage() {
  const events = await getUpcomingPublishedEvents();
  const session = await getSession();
  const attMap = session
    ? await getUserAttendanceMap(
        session.sub,
        events.map((e) => e.id),
      )
    : {};

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">スケジュール</h1>
      <p className="mt-2 text-ink-muted">
        今後の公開イベントの予定です。
        {session ? "各イベントの出欠を登録できます。" : ""}
      </p>

      {events.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {events.map((event) => (
            <li key={event.id} className="py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <DateTime
                  value={event.startAt.toISOString()}
                  className="font-mono text-xs text-accent sm:w-64 sm:shrink-0"
                />
                <div className="flex-1">
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium transition-colors hover:text-accent"
                  >
                    {event.title}
                  </Link>
                  <span className="ml-3 font-mono text-xs text-ink-subtle">
                    {EVENT_TYPE_LABEL[event.type] ?? event.type}
                    {event.location ? ` ・ ${event.location}` : ""}
                  </span>
                </div>
              </div>
              {session && (
                <div className="mt-3 sm:pl-64">
                  <AttendanceControl
                    eventId={event.id}
                    initialStatus={attMap[event.id]}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-ink-muted">予定されているイベントはありません。</p>
      )}

      {!session && (
        <p className="mt-8 font-mono text-xs text-ink-subtle">
          ※{" "}
          <Link href="/login?next=/schedule" className="text-accent hover:underline">
            ログイン
          </Link>{" "}
          すると各イベントに出欠登録ができます。
        </p>
      )}
    </main>
  );
}
