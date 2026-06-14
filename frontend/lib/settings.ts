/** サイト設定の読み取り（SSR / §3-5）。書き込みは Flask(proxy) 経由。 */
import { prisma } from "./prisma";

export async function getSiteSetting() {
  const s = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  return { registrationEnabled: s?.registrationEnabled ?? false };
}
