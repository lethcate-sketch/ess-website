/**
 * メンバー/出欠の読み取り（SSR / §3-5）。書き込みは Flask（BFF proxy）経由。
 */
import { prisma } from "./prisma";

export async function getActiveMembers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { joinedAt: "asc" },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * 指定ユーザーの更新時刻マップ（id -> updatedAt のミリ秒）。
 * アバター(/api/avatar/:userId)のキャッシュ無効化に使う。User がマイページで
 * アバターを差し替えると updatedAt が進むため、参照側の `?v=` を即時に更新できる。
 */
export async function getUsersUpdatedAtMap(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return {} as Record<string, number>;
  const rows = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, updatedAt: true },
  });
  return Object.fromEntries(
    rows.map((r) => [r.id, r.updatedAt.getTime()]),
  ) as Record<string, number>;
}

export async function getUserAttendance(userId: string) {
  return prisma.attendance.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { event: { startAt: "desc" } },
  });
}

/** 指定イベント群に対する自分の出欠状況（eventId -> status）。 */
export async function getUserAttendanceMap(userId: string, eventIds: string[]) {
  if (eventIds.length === 0) return {} as Record<string, string>;
  const rows = await prisma.attendance.findMany({
    where: { userId, eventId: { in: eventIds } },
  });
  return Object.fromEntries(rows.map((r) => [r.eventId, r.status])) as Record<
    string,
    string
  >;
}

export async function getUserAttendanceForEvent(userId: string, eventId: string) {
  return prisma.attendance.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}
