import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { getUpcomingPublishedEvents } from "@/lib/events";

export const metadata = { title: "イベント" };

export default async function EventsPage() {
  const events = await getUpcomingPublishedEvents();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">イベント</h1>
      <p className="mt-2 text-ink-muted">公開中・開催予定のイベント告知です。</p>
      <div className="mt-3">
        <Link href="/events/history" className="font-mono text-xs text-accent hover:underline">
          過去のイベント（履歴）→
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-ink-muted">開催予定のイベントはまだありません。</p>
      )}
    </main>
  );
}
