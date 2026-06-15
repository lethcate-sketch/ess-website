/**
 * サイト内の写真・ロゴの集中管理。
 *
 * 公開ページは配信エンドポイント `/api/images/<key>` を参照する。
 * 実体は「管理画面で設定した画像（DB）」→ 無ければ「デフォルト画像(IMAGE_DEFAULTS)」の順で解決される。
 *
 * - 画像の差し替えは **管理ダッシュボード**（概要 / サークル紹介）から可能（アップロード or URL）。
 * - コード側の初期値を変えたいときは IMAGE_DEFAULTS を編集（差し替えは frontend/public/images/ に置く）。
 */

const api = (key: string) => `/api/images/${key}`;

/** ロゴ（ヘッダー/フッター）。 */
export const LOGO_SRC = api("logo");

type Img = { src: string; alt: string };

/** 公開ページが参照する画像（src は配信エンドポイント）。 */
export const SITE_IMAGES: Record<string, Img> = {
  hero: { src: api("hero"), alt: "ESS の活動風景" },
  galleryDiscussion: { src: api("galleryDiscussion"), alt: "ディスカッションの様子" },
  gallerySpeech: { src: api("gallerySpeech"), alt: "スピーチ・プレゼンの様子" },
  gallerySocial: { src: api("gallerySocial"), alt: "交流会の様子" },
  galleryDrama: { src: api("galleryDrama"), alt: "ドラマ・劇の様子" },
  aboutCover: { src: api("aboutCover"), alt: "ESS メンバー集合写真" },
  aboutActivity1: { src: api("aboutActivity1"), alt: "活動写真 1" },
  aboutActivity2: { src: api("aboutActivity2"), alt: "活動写真 2" },
  aboutActivity3: { src: api("aboutActivity3"), alt: "活動写真 3" },
};

/** 主要メンバーのポートレート（index で割り当て。将来 KeyMember.avatarUrl に統合可）。 */
export function memberPortrait(index: number): string {
  return api(`member-${index}`);
}

// ===== デフォルト画像（管理画面で未設定のとき配信エンドポイントが使う） =====
const sample = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const MEMBER_DEFAULTS = [
  sample("ess-member-1", 400, 400),
  sample("ess-member-2", 400, 400),
  sample("ess-member-3", 400, 400),
  sample("ess-member-4", 400, 400),
  sample("ess-member-5", 400, 400),
  sample("ess-member-6", 400, 400),
];

export const IMAGE_DEFAULTS: Record<string, string> = {
  logo: "/images/logo.svg",
  hero: sample("ess-hero", 1200, 900),
  galleryDiscussion: sample("ess-discussion", 800, 600),
  gallerySpeech: sample("ess-speech", 800, 600),
  gallerySocial: sample("ess-social", 800, 600),
  galleryDrama: sample("ess-drama", 800, 600),
  aboutCover: sample("ess-about", 1400, 700),
  aboutActivity1: sample("ess-act1", 800, 600),
  aboutActivity2: sample("ess-act2", 800, 600),
  aboutActivity3: sample("ess-act3", 800, 600),
};

/** 配信エンドポイント用: key のデフォルト画像URL（無ければ undefined）。 */
export function defaultImage(key: string): string | undefined {
  if (key in IMAGE_DEFAULTS) return IMAGE_DEFAULTS[key];
  const m = /^member-(\d+)$/.exec(key);
  if (m) return MEMBER_DEFAULTS[Number(m[1]) % MEMBER_DEFAULTS.length];
  return undefined;
}

// ===== 管理画面で編集する画像スロットの定義（UIで使用） =====
export type ManagedImage = {
  key: string;
  label: string;
  /** アップロード時の保存形式。ロゴは透過を保つため png。 */
  format?: "png" | "jpeg";
  hint?: string;
};

export const MANAGED_IMAGES: { home: ManagedImage[]; about: ManagedImage[] } = {
  home: [
    { key: "logo", label: "ロゴ", format: "png", hint: "背景が透明な PNG を推奨" },
    { key: "hero", label: "ヒーロー写真（トップ大）" },
    { key: "galleryDiscussion", label: "ギャラリー: Discussion" },
    { key: "gallerySpeech", label: "ギャラリー: Speech" },
    { key: "gallerySocial", label: "ギャラリー: 交流会" },
    { key: "galleryDrama", label: "ギャラリー: Drama" },
  ],
  about: [
    { key: "aboutCover", label: "カバー写真" },
    { key: "aboutActivity1", label: "活動写真 1" },
    { key: "aboutActivity2", label: "活動写真 2" },
    { key: "aboutActivity3", label: "活動写真 3" },
  ],
};
