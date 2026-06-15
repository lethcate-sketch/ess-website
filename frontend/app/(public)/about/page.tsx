import Link from "next/link";

import { Photo } from "@/components/ui/Photo";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { getCircleInfo, getKeyMembers } from "@/lib/circle";
import { memberPortrait, SITE_IMAGES } from "@/lib/siteImages";

export const metadata = { title: "サークル紹介" };

export default async function AboutPage() {
  const [info, members] = await Promise.all([getCircleInfo(), getKeyMembers()]);
  const activities = [
    SITE_IMAGES.aboutActivity1,
    SITE_IMAGES.aboutActivity2,
    SITE_IMAGES.aboutActivity3,
  ];

  return (
    <main>
      {/* ===== カバー写真 ===== */}
      <section className="relative">
        <Photo
          src={SITE_IMAGES.aboutCover.src}
          alt={SITE_IMAGES.aboutCover.alt}
          gradient
          className="h-64 w-full sm:h-80 lg:h-[26rem]"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-content px-6 pb-8">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              About ESS
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white drop-shadow lg:text-5xl">
              サークル紹介
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-content px-6 py-16">
        {/* ===== 活動内容 / 活動頻度 ===== */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line/60 bg-white p-8 shadow-card">
            <SectionTitle icon={ChatIcon} title="活動内容" />
            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-ink">
              {info?.about ?? "（準備中）"}
            </p>
          </div>
          <div className="rounded-3xl border border-line/60 bg-mint-50/50 p-8 shadow-card">
            <SectionTitle icon={CalendarIcon} title="活動頻度" tone="mint" />
            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-ink">
              {info?.frequency ?? "（準備中）"}
            </p>
          </div>
        </div>

        {/* ===== 活動写真 ===== */}
        <section className="mt-16">
          <SectionTitle icon={SparkleIcon} eyebrow="Photos" title="活動の様子" tone="mint" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {activities.map((img) => (
              <div
                key={img.src}
                className="group overflow-hidden rounded-3xl shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <Photo src={img.src} alt={img.alt} className="aspect-[4/3]" />
              </div>
            ))}
          </div>
        </section>

        {/* ===== 主要メンバー ===== */}
        <section className="mt-16">
          <SectionTitle icon={UsersIcon} eyebrow="Members" title="主要メンバー" />
          {members.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m, i) => (
                <div
                  key={m.id}
                  className="group overflow-hidden rounded-3xl border border-line/60 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                >
                  <Photo
                    src={memberPortrait(i)}
                    alt={`${m.name}の写真`}
                    className="aspect-[4/3]"
                  />
                  <div className="p-5">
                    <p className="font-display text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                      {m.role}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-navy">{m.name}</h3>
                    {m.bio && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-muted">準備中です。</p>
          )}
        </section>

        {/* ===== CTA ===== */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/join"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-8 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-card-hover"
          >
            見学・参加を申し込む
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
