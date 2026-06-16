/**
 * 公開イベントの読み取り（SSR / §3-5: 公開ページは Next.js が Prisma Client で直接DB参照）。
 * 書き込み・管理操作は Flask API 経由（M6）。
 */
import { prisma } from "./prisma";

const PUBLIC_STATUSES = ["PUBLISHED", "CLOSED", "ARCHIVED"];

/** 今後（未終了）の公開イベント。トップ/一覧/スケジュール用。 */
export async function getUpcomingPublishedEvents(limit?: number) {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", isPublic: true, endAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    ...(limit ? { take: limit } : {}),
  });
}

/**
 * 指定期間に開始する公開イベント（カレンダー用）。
 * 終了済みでも当該期間に入るものは含める（DRAFT/非公開は除外）。
 */
export async function getPublicEventsInRange(start: Date, end: Date) {
  return prisma.event.findMany({
    where: {
      isPublic: true,
      status: { not: "DRAFT" },
      startAt: { gte: start, lt: end },
    },
    orderBy: { startAt: "asc" },
  });
}

/** 過去（終了済み）の公開イベント。履歴用。 */
export async function getPastEvents() {
  return prisma.event.findMany({
    where: { isPublic: true, status: { in: PUBLIC_STATUSES }, endAt: { lt: new Date() } },
    orderBy: { startAt: "desc" },
  });
}

/** 単一イベント（公開判定は呼び出し側で行う）。 */
export async function getEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

/** 公開ページで閲覧してよいイベントか（DRAFT や非公開は不可）。 */
export function isPublicViewable(event: { isPublic: boolean; status: string }): boolean {
  return event.isPublic && event.status !== "DRAFT";
}
