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
