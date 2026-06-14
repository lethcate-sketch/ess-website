import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { EVENT_TYPE_LABEL } from "@/lib/labels";

type EventLike = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startAt: Date;
  location: string | null;
};

export function EventCard({ event }: { event: EventLike }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col border border-line p-5 transition-colors hover:border-ink"
    >
      <div className="flex items-center justify-between gap-3">
        <Badge tone="accent">{EVENT_TYPE_LABEL[event.type] ?? event.type}</Badge>
        <DateTime
          value={event.startAt.toISOString()}
          dateOnly
          className="font-mono text-xs text-ink-subtle"
        />
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-accent">
        {event.title}
      </h3>
      {event.location && (
        <p className="mt-1 font-mono text-xs text-ink-subtle">{event.location}</p>
      )}
      {event.description && (
        <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{event.description}</p>
      )}
    </Link>
  );
}
