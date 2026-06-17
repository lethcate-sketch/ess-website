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
  scheduleCover: { src: api("scheduleCover"), alt: "活動スケジュールの様子" },
  eventsCover: { src: api("eventsCover"), alt: "イベントの様子" },
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
  scheduleCover: sample("ess-schedule", 1600, 800),
  eventsCover: sample("ess-events", 1600, 800),
};

/** 配信エンドポイント用: key のデフォルト画像URL（無ければ undefined）。 */
export function defaultImage(key: string): string | undefined {
  if (key in IMAGE_DEFAULTS) return IMAGE_DEFAULTS[key];
  const m = /^member-(\d+)$/.exec(key);
  if (m) return MEMBER_DEFAULTS[Number(m[1]) % MEMBER_DEFAULTS.length];
  // トップのフィーチャー/ギャラリー項目（feature-<id> / gallery-<id>）は未設定でも
  // キーをseedにしたサンプルを返し、画像割れを防ぐ。
  if (/^(feature|gallery)-/.test(key)) return sample(key, 800, 600);
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
  // ロゴと各ページのカバー写真。トップのヒーロー画像・ギャラリー画像は
  // 概要ページの「ヒーロー編集」「ギャラリー編集」で扱う。
  home: [
    { key: "logo", label: "ロゴ", format: "png", hint: "背景が透明な PNG を推奨" },
    { key: "scheduleCover", label: "スケジュール: ヒーロー写真", hint: "横長の活動写真を推奨" },
    { key: "eventsCover", label: "イベント: ヒーロー写真", hint: "横長の活動写真を推奨" },
  ],
  about: [
    { key: "aboutCover", label: "カバー写真" },
    { key: "aboutActivity1", label: "活動写真 1" },
    { key: "aboutActivity2", label: "活動写真 2" },
    { key: "aboutActivity3", label: "活動写真 3" },
  ],
};
