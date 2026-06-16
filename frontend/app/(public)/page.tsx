import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { PageHero } from "@/components/ui/PageHero";
import { Photo } from "@/components/ui/Photo";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatIcon,
  GlobeIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { getUpcomingPublishedEvents } from "@/lib/events";
import { SITE_IMAGES } from "@/lib/siteImages";

// トップ「活動の様子」ギャラリー
const GALLERY = [
  { key: "discussion", label: "Discussion", img: SITE_IMAGES.galleryDiscussion },
  { key: "speech", label: "Speech", img: SITE_IMAGES.gallerySpeech },
  { key: "social", label: "交流会", img: SITE_IMAGES.gallerySocial },
  { key: "drama", label: "Drama", img: SITE_IMAGES.galleryDrama },
];

const FEATURES = [
  {
    Icon: ChatIcon,
    title: "英語でディスカッション",
    body: "テーマに沿って、レベル別の少人数グループで自由に話します。話す力と考える力が自然と育ちます。",
    chip: "bg-brand-50 text-brand-600 ring-brand-100",
    card: "bg-brand-50/40",
  },
  {
    Icon: GlobeIcon,
    title: "国際的な交流",
    body: "多様なバックグラウンドのメンバーや外部サークルとの交流で、視野と世界が広がります。",
    chip: "bg-mint-50 text-mint-400 ring-mint-100",
    card: "bg-mint-50/50",
  },
  {
    Icon: UsersIcon,
    title: "あたたかいコミュニティ",
    body: "初参加・見学はいつでも歓迎。英語が得意でなくても大丈夫。まずは雰囲気を見にきてください。",
    chip: "bg-brand-50 text-brand-600 ring-brand-100",
    card: "bg-brand-50/40",
  },
];

export default async function HomePage() {
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
        title={
          <>
            英語で、<span className="text-mint-200">世界</span>と議論しよう。
          </>
        }
        subtitle="レベルを問わず英語でのディスカッションを楽しむサークルです。定例会・特別企画・外部交流を通じて、話す力と考える力を磨きます。見学・初参加はいつでも歓迎します。"
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

      {/* ===== 特徴 ===== */}
      <section className="mx-auto max-w-content px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <SectionTitle
          icon={SparkleIcon}
          eyebrow="Why ESS"
          title="ESS でできること"
          tone="mint"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-3xl border border-line/60 ${f.card} p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-card-hover`}
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${f.chip}`}
              >
                <f.Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-navy">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 活動の様子（ギャラリー） ===== */}
      <section className="bg-white/60 py-20 lg:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-16">
          <SectionTitle icon={UsersIcon} eyebrow="Gallery" title="活動の様子" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((g) => (
              <div
                key={g.key}
                className="group overflow-hidden rounded-3xl shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <Photo
                  src={g.img.src}
                  alt={g.img.alt}
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
