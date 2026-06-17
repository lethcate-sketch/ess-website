/** トップページ編集コンテンツの読み取り（SSR / §3-5）。書き込みは Flask(proxy) 経由。 */
import {
  HOME_DEFAULTS,
  type FeatureItem,
  type GalleryItem,
} from "./homeDefaults";
import { prisma } from "./prisma";

function parseItems<T>(raw: string | null | undefined, fallback: T[]): T[] {
  // NULL/undefined（未設定）は既定値。"[]" は「全削除」として空配列を返す。
  if (raw == null) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export async function getHomeContent() {
  let row: Awaited<ReturnType<typeof prisma.homeContent.findUnique>> = null;
  try {
    row = await prisma.homeContent.findUnique({ where: { id: "default" } });
  } catch {
    // テーブル未作成 / DB 未到達時は既定値にフォールバック
  }
  return {
    heroTitle: row?.heroTitle || HOME_DEFAULTS.heroTitle,
    heroSubtitle: row?.heroSubtitle || HOME_DEFAULTS.heroSubtitle,
    featureEyebrow: row?.featureEyebrow || HOME_DEFAULTS.featureEyebrow,
    featureTitle: row?.featureTitle || HOME_DEFAULTS.featureTitle,
    featureItems: parseItems<FeatureItem>(row?.featureItems, HOME_DEFAULTS.featureItems),
    galleryEyebrow: row?.galleryEyebrow || HOME_DEFAULTS.galleryEyebrow,
    galleryTitle: row?.galleryTitle || HOME_DEFAULTS.galleryTitle,
    galleryItems: parseItems<GalleryItem>(row?.galleryItems, HOME_DEFAULTS.galleryItems),
  };
}
