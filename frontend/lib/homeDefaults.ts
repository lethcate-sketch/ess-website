/**
 * トップページ編集コンテンツの既定値。
 *
 * HomeContent（DB）の各項目が未設定（NULL）のとき、ここの値で表示する。
 * 項目（feature/gallery）の画像は SiteImage の key "feature-<id>" / "gallery-<id>" に保存し、
 * 未設定なら siteImages.ts の defaultImage() がサンプル画像を返す。
 */

export type FeatureItem = { id: string; title: string; body: string };
export type GalleryItem = { id: string; label: string };

export const HOME_DEFAULTS = {
  heroTitle: "英語で、世界と議論しよう。",
  heroSubtitle:
    "レベルを問わず英語でのディスカッションを楽しむサークルです。定例会・特別企画・外部交流を通じて、話す力と考える力を磨きます。見学・初参加はいつでも歓迎します。",
  featureEyebrow: "Why ESS",
  featureTitle: "ESS でできること",
  featureItems: [
    {
      id: "f1",
      title: "英語でディスカッション",
      body: "テーマに沿って、レベル別の少人数グループで自由に話します。話す力と考える力が自然と育ちます。",
    },
    {
      id: "f2",
      title: "国際的な交流",
      body: "多様なバックグラウンドのメンバーや外部サークルとの交流で、視野と世界が広がります。",
    },
    {
      id: "f3",
      title: "あたたかいコミュニティ",
      body: "初参加・見学はいつでも歓迎。英語が得意でなくても大丈夫。まずは雰囲気を見にきてください。",
    },
  ] as FeatureItem[],
  galleryEyebrow: "Gallery",
  galleryTitle: "活動の様子",
  galleryItems: [
    { id: "g1", label: "Discussion" },
    { id: "g2", label: "Speech" },
    { id: "g3", label: "交流会" },
    { id: "g4", label: "Drama" },
  ] as GalleryItem[],
};
