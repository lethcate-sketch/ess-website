import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { PageHero } from "@/components/ui/PageHero";
import { Photo } from "@/components/ui/Photo";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { getHomeContent } from "@/lib/home";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { SITE_IMAGES } from "@/lib/siteImages";

export default async function HomePage() {
  const home = await getHomeContent();
  // イベント取得が失敗してもトップ全体を 500 にせず、ヒーローは表示する（堅牢化）。
  let events: Awaited<ReturnType<typeof getUpcomingPublishedEvents>> = [];
  try {
    events = await getUpcomingPublishedEvents(3);
  } catch (e) {
    console.error("Failed to load upcoming events:", e);
  }

  return (
    <main>
      {/* ===== ヒーロー（大きな活動写真 + 見出し） ===== */}
      <PageHero
        src={SITE_IMAGES.hero.src}
        alt={SITE_IMAGES.hero.alt}
        size="tall"
        eyebrow="English Speaking Society"
        title={home.heroTitle}
        subtitle={home.heroSubtitle}
      >
        <Link
          href="/join"
          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-card-hover"
        >
          見学・参加する
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3 font-display text-sm font-semibold text-white ring-1 ring-white/50 backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/20"
        >
          イベントを見る
        </Link>
      </PageHero>

      {/* ===== 特徴（Why ESS） ===== */}
      {home.featureItems.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <SectionTitle
            icon={SparkleIcon}
            eyebrow={home.featureEyebrow}
            title={home.featureTitle}
            tone="mint"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {home.featureItems.map((f) => (
              <div
                key={f.id}
                className="group overflow-hidden rounded-3xl border border-line/60 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <Photo
                  src={`/api/images/feature-${f.id}`}
                  alt={f.title}
                  className="aspect-[16/10]"
                />
                <div className="p-7">
                  <h3 className="font-display text-lg font-bold text-navy">{f.title}</h3>
                  {f.body && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 活動の様子（ギャラリー） ===== */}
      {home.galleryItems.length > 0 && (
        <section className="bg-white/60 py-20 lg:py-28">
          <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
            <SectionTitle
              icon={UsersIcon}
              eyebrow={home.galleryEyebrow}
              title={home.galleryTitle}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {home.galleryItems.map((g) => (
                <div
                  key={g.id}
                  className="group overflow-hidden rounded-3xl shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                >
                  <Photo
                    src={`/api/images/gallery-${g.id}`}
                    alt={g.label}
                    gradient
                    className="aspect-square"
                    overlay={
                      <span className="absolute bottom-3 left-4 font-display text-base font-bold text-white drop-shadow">
                        {g.label}
                      </span>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 今後のイベント ===== */}
      <section className="mx-auto max-w-content px-6 pb-24 sm:px-10 lg:px-16">
        <SectionTitle
          icon={CalendarIcon}
          eyebrow="Upcoming"
          title="今後のイベント"
          action={
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              すべて見る
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          }
        />
        {events.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-line bg-white/60 p-12 text-center">
            <ChatIcon className="mx-auto h-10 w-10 text-brand-300" />
            <p className="mt-3 text-sm text-ink-muted">
              公開予定のイベントはまだありません。
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
