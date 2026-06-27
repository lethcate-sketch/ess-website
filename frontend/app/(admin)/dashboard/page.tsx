import Link from "next/link";
import type { ReactNode } from "react";

import { FeatureSectionForm } from "@/components/admin/FeatureSectionForm";
import { GallerySectionForm } from "@/components/admin/GallerySectionForm";
import { HeroForm } from "@/components/admin/HeroForm";
import { ImageManager } from "@/components/admin/ImageManager";
import { getAdminStats } from "@/lib/admin";
import { getHomeContent } from "@/lib/home";
import { MANAGED_IMAGES } from "@/lib/siteImages";
import { cn } from "@/lib/utils";

export const metadata = { title: "管理ダッシュボード" };

function EditSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Stat({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const content = (
    <div
      className={cn(
        "h-full border border-line bg-surface p-5",
        href && "transition-colors hover:border-accent",
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function DashboardPage() {
  const [s, home] = await Promise.all([getAdminStats(), getHomeContent()]);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">管理ダッシュボード</h1>
      <p className="mt-2 text-ink-muted">サークル運営のサマリです。</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="メンバー" value={s.members} href="/dashboard/members" />
        <Stat label="管理者" value={s.admins} />
        <Stat label="公開イベント" value={s.published} href="/dashboard/events" />
        <Stat label="今後の予定" value={s.upcoming} />
        <Stat label="出席率" value={s.attendanceRate != null ? `${s.attendanceRate}%` : "—"} />
        <Stat label="未対応の申込" value={s.pendingReq} href="/dashboard/requests" />
        <Stat label="未対応の問い合わせ" value={s.pendingContact} href="/dashboard/requests" />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/dashboard/events"
          className="border border-accent bg-accent px-4 py-2 text-sm text-accent-fg hover:bg-accent-hover"
        >
          イベントを作成・管理
        </Link>
        <Link
          href="/dashboard/requests"
          className="border border-line px-4 py-2 text-sm hover:border-ink"
        >
          申込・問い合わせ
        </Link>
        <Link
          href="/dashboard/members"
          className="border border-line px-4 py-2 text-sm hover:border-ink"
        >
          メンバー管理
        </Link>
        <Link
          href="/dashboard/line"
          className="border border-line px-4 py-2 text-sm hover:border-ink"
        >
          LINE招待コード
        </Link>
      </div>

      {/* ===== トップページ編集 ===== */}
      <h2 className="mt-16 text-2xl font-semibold tracking-tight">トップページの編集</h2>
      <p className="mt-1 text-sm text-ink-muted">
        トップページの文章・画像を編集します。各セクションごとに「保存する」で反映され、反映後はページを再読み込みしてください。
      </p>

      <EditSection
        title="ヒーローセクション"
        description="トップ最上部の見出し・説明文・背景画像を編集します。"
      >
        <HeroForm
          initial={{ heroTitle: home.heroTitle, heroSubtitle: home.heroSubtitle }}
        />
      </EditSection>

      <EditSection
        title="フィーチャーセクション（Why ESS）"
        description="見出しと、写真・タイトル・本文の項目を編集します。項目の追加・削除もできます。"
      >
        <FeatureSectionForm
          initial={{
            featureEyebrow: home.featureEyebrow,
            featureTitle: home.featureTitle,
            featureItems: home.featureItems,
          }}
        />
      </EditSection>

      <EditSection
        title="ギャラリーセクション"
        description="見出しと、サムネイル画像・ラベルの項目を編集します。項目の追加・削除もできます。"
      >
        <GallerySectionForm
          initial={{
            galleryEyebrow: home.galleryEyebrow,
            galleryTitle: home.galleryTitle,
            galleryItems: home.galleryItems,
          }}
        />
      </EditSection>

      {/* ===== その他のサイト画像 ===== */}
      <EditSection
        title="その他のサイト画像"
        description="ロゴと、各ページ（スケジュール・イベント）のヒーロー写真を差し替えます。"
      >
        <ImageManager images={MANAGED_IMAGES.home} />
      </EditSection>
    </main>
  );
}
