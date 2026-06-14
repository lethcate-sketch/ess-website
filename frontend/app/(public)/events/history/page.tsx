import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { getPastEvents } from "@/lib/events";

export const metadata = { title: "イベント履歴" };

export default async function EventHistoryPage() {
  const events = await getPastEvents();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">イベント履歴</h1>
      <p className="mt-2 text-ink-muted">これまでに開催したイベントの記録です。</p>
      <div className="mt-3">
        <Link href="/events" className="font-mono text-xs text-accent hover:underline">
          ← 開催予定のイベント
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-ink-muted">過去のイベントはまだありません。</p>
      )}
    </main>
  );
}
