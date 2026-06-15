# 写真・ロゴの差し替え方法

このフォルダ（`frontend/public/images/`）に画像ファイルを置くと、サイトから
`/images/ファイル名` で参照できます。

## 画像の一元管理

サイトで使う写真・ロゴの「どの画像を使うか」は、すべて
**`frontend/lib/siteImages.ts`** の1ファイルに集約しています。
差し替えは基本的に「このファイルの `src` を書き換えるだけ」です。

## ロゴを差し替える

1. ロゴ画像（推奨: 背景が透明な PNG）をこのフォルダに置く
   例: `frontend/public/images/logo.png`
2. `frontend/lib/siteImages.ts` の次の行を変更:
   ```ts
   export const LOGO_SRC = "/images/logo.svg";
   //                    ↓
   export const LOGO_SRC = "/images/logo.png";
   ```
   ※ ヘッダーは明るい背景です。背景が濃い色のロゴはそのままだと枠が目立つため、
     背景透過のロゴを推奨します。

## 写真を差し替える

1. 写真をこのフォルダに置く（例: `frontend/public/images/hero.jpg`）
2. `frontend/lib/siteImages.ts` の該当する `src` をローカルパスに変更:
   ```ts
   hero: { src: "https://picsum.photos/seed/ess-hero/1200/900", alt: "..." },
   //          ↓
   hero: { src: "/images/hero.jpg", alt: "ESS の活動風景" },
   ```

### 各スロットの用途
| キー | 使われる場所 |
|---|---|
| `hero` | トップのヒーロー大写真 |
| `galleryDiscussion` / `gallerySpeech` / `gallerySocial` / `galleryDrama` | トップ「活動の様子」 |
| `aboutCover` | サークル紹介ページ上部のカバー写真 |
| `aboutActivity1〜3` | サークル紹介ページの活動写真 |
| `MEMBER_PORTRAITS`（配列） | 主要メンバーのポートレート（上から順に割り当て） |

## 反映方法

ファイルを置き換え・`siteImages.ts` を編集したら、コミットして push すると
Render が自動で再デプロイし、本番サイトに反映されます。

```
git add frontend/public/images frontend/lib/siteImages.ts
git commit -m "写真・ロゴを差し替え"
git push
```

## 推奨サイズ・形式
- 形式: JPG（写真）/ PNG（ロゴ・透過）/ WebP
- ヒーロー: 横長 約1600×1000px
- 活動写真・ギャラリー: 約1000×750px
- メンバー: 正方形 約600×600px
- 1枚あたり 300KB 程度に圧縮すると表示が軽くなります
