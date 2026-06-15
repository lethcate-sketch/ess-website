import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { ChatIcon, GlobeIcon, SparkleIcon, UsersIcon, PinIcon } from "@/components/ui/Icons";
import { EVENT_TYPE_LABEL } from "@/lib/labels";

type EventLike = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startAt: Date;
  location: string | null;
};

// 種別ごとのメディア領域（写真の代わり）: グラデーション + アイコン。
const MEDIA: Record<
  string,
  { gradient: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  REGULAR: { gradient: "bg-sky-gradient", Icon: ChatIcon },
  SPECIAL: { gradient: "bg-brand-gradient", Icon: SparkleIcon },
  SOCIAL: { gradient: "bg-mint-gradient", Icon: UsersIcon },
  EXTERNAL: {
    gradient: "bg-[linear-gradient(135deg,#7CC4FF_0%,#A8F1D0_100%)]",
    Icon: GlobeIcon,
  },
};

export function EventCard({ event }: { event: EventLike }) {
  const media = MEDIA[event.type] ?? MEDIA.REGULAR;
  const Icon = media.Icon;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-white shadow-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-card-hover"
    >
      {/* メディア（写真位置） */}
      <div className={`relative h-36 ${media.gradient}`}>
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,#fff_0%,transparent_45%)]" />
        <Icon className="absolute right-4 top-4 h-16 w-16 text-white/70 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute bottom-3 left-4">
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 font-display text-xs font-semibold text-navy shadow-soft backdrop-blur">
            <DateTime value={event.startAt.toISOString()} dateOnly />
          </span>
        </div>
      </div>

      {/* テキスト */}
      <div className="flex flex-1 flex-col p-5">
        <Badge tone="brand">{EVENT_TYPE_LABEL[event.type] ?? event.type}</Badge>
        <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-navy transition-colors group-hover:text-brand-600">
          {event.title}
        </h3>
        {event.location && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-subtle">
            <PinIcon className="h-3.5 w-3.5" />
            {event.location}
          </p>
        )}
        {event.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {event.description}
          </p>
        )}
      </div>
    </Link>
  );
}
