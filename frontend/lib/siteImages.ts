/**
 * サイト内の写真・画像を集中管理する場所。
 * 画像の差し替えは「このファイルの src を書き換えるだけ」で完了します。
 *
 * 初期値はフリー画像（https://picsum.photos の実写真。ランダムな差し替え用サンプル）。
 * 本番の写真に差し替えるときは:
 *   1) 画像を frontend/public/images/ に置く（例: frontend/public/images/hero.jpg）
 *   2) 下の src を "/images/hero.jpg" のようなローカルパスに変更する
 * 詳しい手順は frontend/public/images/README.md を参照。
 */

/** ロゴ（ヘッダー/フッターで使用）。添付ロゴを public/images/logo.png に置いて差し替え。 */
export const LOGO_SRC = "/images/logo.svg";

type Img = { src: string; alt: string };

const sample = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const SITE_IMAGES: Record<string, Img> = {
  // ヒーロー（トップの大きな写真）
  hero: { src: sample("ess-hero", 1200, 900), alt: "ESS の活動風景" },

  // トップ「活動の様子」ギャラリー
  galleryDiscussion: { src: sample("ess-discussion", 800, 600), alt: "ディスカッションの様子" },
  gallerySpeech: { src: sample("ess-speech", 800, 600), alt: "スピーチ・プレゼンの様子" },
  gallerySocial: { src: sample("ess-social", 800, 600), alt: "交流会の様子" },
  galleryDrama: { src: sample("ess-drama", 800, 600), alt: "ドラマ・劇の様子" },

  // サークル紹介ページ
  aboutCover: { src: sample("ess-about", 1400, 700), alt: "ESS メンバー集合写真" },
  aboutActivity1: { src: sample("ess-act1", 800, 600), alt: "活動写真 1" },
  aboutActivity2: { src: sample("ess-act2", 800, 600), alt: "活動写真 2" },
  aboutActivity3: { src: sample("ess-act3", 800, 600), alt: "活動写真 3" },
};

/** 主要メンバーのポートレート（人数ぶん。index で割り当て。差し替えは src を変更）。 */
export const MEMBER_PORTRAITS: string[] = [
  sample("ess-member-1", 400, 400),
  sample("ess-member-2", 400, 400),
  sample("ess-member-3", 400, 400),
  sample("ess-member-4", 400, 400),
  sample("ess-member-5", 400, 400),
  sample("ess-member-6", 400, 400),
];

/** index に対応するメンバー写真を返す（人数を超えても循環して必ず1枚返す）。 */
export function memberPortrait(index: number): string {
  return MEMBER_PORTRAITS[index % MEMBER_PORTRAITS.length];
}
