import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ルートの単一 .env を読み込む（§9: Prisma / Flask と共有する）。
// サーバ実行時に process.env.DATABASE_URL / FLASK_API_BASE_URL 等を利用可能にする。
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma Client（ルート node_modules で生成）をサーバ外部依存として扱い、
  // クエリエンジンをバンドルせず実行時に require する。
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", ".prisma/client"],
  },
  // NEXT_PUBLIC_ のみクライアントへ公開（JWT_SECRET 等の機密は決して公開しない / §3-4）。
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;
