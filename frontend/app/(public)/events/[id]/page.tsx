import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AttendanceControl } from "@/components/events/AttendanceControl";
import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { getSession } from "@/lib/auth";
import { getEventById, isPublicViewable } from "@/lib/events";
import { EVENT_STATUS_LABEL, EVENT_TYPE_LABEL } from "@/lib/labels";
import { getUserAttendanceForEvent } from "@/lib/members";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);
  return { title: event?.title ?? "イベント" };
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);
  if (!event || !isPublicViewable(event)) notFound();

  const session = await getSession();
  const attendance = session
    ? await getUserAttendanceForEvent(session.sub, event.id)
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/events" className="font-mono text-xs text-ink-muted hover:text-accent">
        ← イベント一覧
      </Link>

      <div className="mt-6 flex items-center gap-2">
        <Badge tone="accent">{EVENT_TYPE_LABEL[event.type] ?? event.type}</Badge>
        {event.status !== "PUBLISHED" && (
          <Badge tone="muted">{EVENT_STATUS_LABEL[event.status] ?? event.status}</Badge>
        )}
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{event.title}</h1>

      <dl className="mt-8 grid gap-px border border-line bg-line text-sm sm:grid-cols-2">
        <Row label="開始">
          <DateTime value={event.startAt.toISOString()} />
        </Row>
        <Row label="終了">
          <DateTime value={event.endAt.toISOString()} />
        </Row>
        <Row label="場所">{event.location ?? "—"}</Row>
        <Row label="定員">{event.capacity != null ? `${event.capacity} 名` : "—"}</Row>
      </dl>

      {event.description && (
        <div className="mt-8 whitespace-pre-wrap leading-relaxed text-ink">
          {event.description}
        </div>
      )}

      <div className="mt-10 border-t border-line pt-6">
        {session ? (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              出欠登録
            </p>
            <div className="mt-3">
              <AttendanceControl
                eventId={event.id}
                initialStatus={attendance?.status ?? null}
                initialComment={attendance?.comment ?? ""}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/join?eventId=${event.id}`}
              className="border border-accent bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              参加を申し込む
            </Link>
            <Link
              href={`/login?next=/events/${event.id}`}
              className="border border-line px-5 py-2 text-sm font-medium transition-colors hover:border-ink"
            >
              ログインして出欠登録
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
