/** サークル紹介の読み取り（SSR / §3-5）。書き込みは Flask(proxy) 経由。 */
import { prisma } from "./prisma";

export async function getCircleInfo() {
  return prisma.circleInfo.findUnique({ where: { id: "default" } });
}

export async function getKeyMembers() {
  return prisma.keyMember.findMany({
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });
}
