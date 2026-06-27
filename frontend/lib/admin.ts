/**
 * 管理画面の読み取り（SSR / §3-5、admin ページ）。書き込みは Flask(proxy) 経由。
 * アクセス保護は middleware（role=ADMIN）。
 */
import { prisma } from "./prisma";

export async function getAllEvents() {
  return prisma.event.findMany({ orderBy: { startAt: "desc" } });
}

export async function getEventWithAttendance(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: { attendances: { include: { user: true } } },
  });
}

export async function getAllParticipationRequests() {
  return prisma.participationRequest.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAllContacts() {
  return prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAllUsers() {
  return prisma.user.findMany({ orderBy: { joinedAt: "asc" } });
}

export async function getAdminStats() {
  const [members, admins, published, upcoming, pendingReq, pendingContact, totalAtt, presentAtt] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true, role: "ADMIN" } }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.event.count({ where: { status: "PUBLISHED", endAt: { gte: new Date() } } }),
      prisma.participationRequest.count({ where: { status: "NEW" } }),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: { in: ["ATTENDING", "LATE"] } } }),
    ]);
  return {
    members,
    admins,
    published,
    upcoming,
    pendingReq,
    pendingContact,
    attendanceRate: totalAtt ? Math.round((presentAtt / totalAtt) * 1000) / 10 : null,
  };
}

/** LINE 招待コード一覧（新しい順）。userId 指定コードには宛先メンバー名(targetName)を解決して付与。 */
export async function getLineLinkTokens() {
  const tokens = await prisma.lineLinkToken.findMany({
    orderBy: { createdAt: "desc" },
  });
  const ids = [...new Set(tokens.filter((t) => t.userId).map((t) => t.userId as string))];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  return tokens.map((t) => ({
    ...t,
    targetName: t.userId ? nameById.get(t.userId) ?? null : null,
  }));
}
