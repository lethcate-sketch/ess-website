/**
 * Prisma Client シングルトン（SSR/SSG の読み取り用 / §3-5）。
 * 公開ページ・一覧表示は Next.js が Prisma Client で直接DB参照する。
 * 書き込み・業務ロジックは Flask API 経由（lib/api.ts, M2 で追加）。
 *
 * クライアントはルート node_modules/@prisma/client に生成される（§5 スキーマを改変しないため）。
 * 開発時のホットリロードで多重生成しないよう globalThis にキャッシュする。
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
