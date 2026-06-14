import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { getUpcomingPublishedEvents } from "@/lib/events";

export default async function HomePage() {
  const events = await getUpcomingPublishedEvents(3);

  return (
    <main className="mx-auto max-w-content px-6">
      <section className="py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          English Speaking Society
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">英語で、議論する。</h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-ink-muted">
          ESS は、レベルを問わず英語でのディスカッションを楽しむサークルです。定例会・特別企画・外部交流を通じて、
          話す力と考える力を磨きます。見学・初参加はいつでも歓迎します。
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/join"
            className="border border-accent bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            見学・参加する
          </Link>
          <Link
            href="/events"
            className="border border-line px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            イベントを見る
          </Link>
        </div>
      </section>

      <section className="border-t border-line py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">今後のイベント</h2>
          <Link href="/events" className="font-mono text-xs text-accent hover:underline">
            すべて見る →
          </Link>
        </div>
        {events.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-ink-muted">公開予定のイベントはまだありません。</p>
        )}
      </section>
    </main>
  );
}
