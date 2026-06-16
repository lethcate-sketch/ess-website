/**
 * ローカル開発用 SQLite スキーマの派生生成。
 *
 * 真実源は `prisma/schema.prisma`（provider = postgresql / Render 本番が使用）。
 * 本スクリプトはそれを読み込み、provider だけを sqlite に差し替えた
 * `prisma/schema.local.prisma`（生成物・gitignore）を書き出す。
 *
 * これにより schema を二重管理せず、ローカルだけ SQLite で動かせる。
 *   npm run db:local        # 派生 → dev.db へ db push → Client 再生成
 *   npm run db:local:schema # 派生のみ
 *
 * Render（本番 postgres）は `prisma/schema.prisma` をそのまま使うため一切影響しない。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = join(here, "schema.prisma");
const outPath = join(here, "schema.local.prisma");

const src = readFileSync(srcPath, "utf8");

// datasource ブロックの provider を sqlite に差し替える。
const replaced = src.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"postgresql"([^\n]*)/,
  '$1"sqlite"$2',
);

if (replaced === src) {
  console.error(
    "[local-sqlite] provider = \"postgresql\" が schema.prisma に見つかりませんでした。中止します。",
  );
  process.exit(1);
}

const header =
  "// ⚠ 自動生成: `node prisma/local-sqlite.mjs` が schema.prisma から生成。直接編集しないこと。\n" +
  "// ローカル開発(SQLite)専用。真実源は schema.prisma。\n\n";

writeFileSync(outPath, header + replaced.replace(/^﻿/, ""), "utf8");
console.log("[local-sqlite] 生成: prisma/schema.local.prisma (provider=sqlite)");
