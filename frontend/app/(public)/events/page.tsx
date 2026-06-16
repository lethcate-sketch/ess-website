import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { PageHero } from "@/components/ui/PageHero";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { SITE_IMAGES } from "@/lib/siteImages";

export const metadata = { title: "イベント" };

export default async function EventsPage() {
  const events = await getUpcomingPublishedEvents();

  return (
    <main>
      <PageHero
        src={SITE_IMAGES.eventsCover.src}
        alt={SITE_IMAGES.eventsCover.alt}
        eyebrow="Events"
        title="イベント"
        subtitle="公開中・開催予定のイベント告知です。"
      />

      <div className="mx-auto max-w-content px-6 py-20 sm:px-10 lg:px-16">
        <div>
          <Link
            href="/events/history"
            className="font-mono text-xs text-accent hover:underline"
          >
            過去のイベント（履歴）→
          </Link>
        </div>

        {events.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-ink-muted">
            開催予定のイベントはまだありません。
          </p>
        )}
      </div>
    </main>
  );
}
