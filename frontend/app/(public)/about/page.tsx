import Link from "next/link";

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
import { getCircleInfo, getKeyMembers } from "@/lib/circle";
import { getUsersUpdatedAtMap } from "@/lib/members";
import { memberPortrait, SITE_IMAGES } from "@/lib/siteImages";

export const metadata = { title: "サークル紹介" };

export default async function AboutPage() {
  const [info, members] = await Promise.all([getCircleInfo(), getKeyMembers()]);
  // 紐づくユーザーの updatedAt でアバターのキャッシュを無効化する（KeyMember 側の
  // updatedAt はユーザーがアバターを変えても進まないため、User の更新時刻を使う）。
  const linkedUserUpdatedAt = await getUsersUpdatedAtMap(
    members.map((m) => m.userId).filter((id): id is string => Boolean(id)),
  );
  const activities = [
    SITE_IMAGES.aboutActivity1,
    SITE_IMAGES.aboutActivity2,
    SITE_IMAGES.aboutActivity3,
  ];

  return (
    <main>
      {/* ===== ヒーロー（カバー写真） ===== */}
      <PageHero
        src={SITE_IMAGES.aboutCover.src}
        alt={SITE_IMAGES.aboutCover.alt}
        eyebrow="About ESS"
        title="サークル紹介"
        subtitle="活動内容や活動頻度、主要メンバーを紹介します。"
      />

      <div className="mx-auto max-w-content px-6 py-20 sm:px-10 lg:px-16">
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
                    src={
                      m.userId
                        ? `/api/avatar/${m.userId}?v=${
                            linkedUserUpdatedAt[m.userId] ?? m.updatedAt.getTime()
                          }`
                        : memberPortrait(i)
                    }
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
