import Link from "next/link";

import { AttendanceControl } from "@/components/events/AttendanceControl";
import { EventCalendar } from "@/components/events/EventCalendar";
import { DateTime } from "@/components/ui/DateTime";
import { PageHero } from "@/components/ui/PageHero";
import { getSession } from "@/lib/auth";
import { getPublicEventsInRange, getUpcomingPublishedEvents } from "@/lib/events";
import { EVENT_TYPE_LABEL } from "@/lib/labels";
import { getUserAttendanceMap } from "@/lib/members";
import { SITE_IMAGES } from "@/lib/siteImages";

export const metadata = { title: "スケジュール" };

/** 当月1日(JST)〜翌々月1日(JST) の範囲 [start, end) を求める。 */
function calendarWindow(now: Date): { start: Date; end: Date } {
  const [y, m] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const start = new Date(Date.UTC(y, m - 1, 1) - JST_OFFSET); // 当月1日 00:00 JST
  const end = new Date(Date.UTC(y, m + 1, 1) - JST_OFFSET); // 翌々月1日 00:00 JST
  return { start, end };
}

export default async function SchedulePage() {
  const now = new Date();
  const { start, end } = calendarWindow(now);
  const [calendarEvents, upcoming, session] = await Promise.all([
    getPublicEventsInRange(start, end),
    getUpcomingPublishedEvents(),
    getSession(),
  ]);
  const attMap = session
    ? await getUserAttendanceMap(
        session.sub,
        upcoming.map((e) => e.id),
      )
    : {};

  return (
    <main>
      <PageHero
        src={SITE_IMAGES.scheduleCover.src}
        alt={SITE_IMAGES.scheduleCover.alt}
        eyebrow="Schedule"
        title="スケジュール"
        subtitle={`今後の公開イベントの予定です。${
          session ? "ログイン中は各イベントの出欠を登録できます。" : ""
        }`}
      />

      <div className="mx-auto max-w-content px-6 py-20 sm:px-10 lg:px-16">
        {/* ===== カレンダー（当月・翌月） ===== */}
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight text-navy">
            カレンダー
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            当月・翌月の公開イベントです。タイトルをクリックすると詳細を表示します。
          </p>
          <div className="mt-6">
            <EventCalendar
              events={calendarEvents.map((e) => ({
                id: e.id,
                title: e.title,
                startAt: e.startAt,
              }))}
              now={now}
            />
          </div>
        </section>

        {/* ===== 今後の予定（リスト） ===== */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-navy">
            今後の予定
          </h2>

          {upcoming.length > 0 ? (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {upcoming.map((event) => (
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
                        initialStatus={attMap[event.id]?.status ?? null}
                        initialComment={attMap[event.id]?.comment ?? ""}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-ink-muted">
              予定されているイベントはありません。
            </p>
          )}

          {!session && (
            <p className="mt-8 font-mono text-xs text-ink-subtle">
              ※{" "}
              <Link
                href="/login?next=/schedule"
                className="text-accent hover:underline"
              >
                ログイン
              </Link>{" "}
              すると各イベントに出欠登録ができます。
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
