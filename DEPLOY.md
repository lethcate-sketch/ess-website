# デプロイ手順（Neon + Vercel + Render）— ゼロ円構成

LINE移行に伴う本番構成のセットアップ手順。**月額¥0** を目標にした3層構成。

```
Neon (無料Postgres)  ── DB（全層が接続）
Vercel (Next.js)     ── 公開ページ・管理画面UI・LINE Webhook・BFFプロキシ
Render 無料 (Flask)  ── 管理API（書き込み・認証）
```

> なぜFlaskが残るか: 管理画面の書き込み（イベント・メンバー・招待コード・設定・画像）と認証はFlask経由のため。
> LINE WebhookはVercel側にあるので、Flaskがスリープしても出欠受信には影響しない。

---

## 0. 前提
- GitHub リポジトリ: `lethcate-sketch/ess-website`（Vercelが参照）
- 機密値（接続文字列・JWT_SECRET・LINEトークン）は各プラットフォームの環境変数に設定。**リポジトリには置かない**。

## 1. Neon（DB）
1. https://neon.tech でプロジェクト作成（リージョンは東京 `ap-northeast-1` 推奨）。
2. **接続文字列（Connection string）をコピー**。低トラフィックなので **Direct connection（プールなし）** を使う。
   形式: `postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require`
3. これを以降 `DATABASE_URL` として Vercel・Render・（初回マイグレーション）で使う。

## 2. スキーマ適用 & 初期管理者（1回だけ・手元から）
ローカルから Neon に対してマイグレーションとseedを1回流す（以降のマイグレーションはVercelビルドが自動実行）。

```bash
# リポジトリルートで（PowerShell例）
$env:DATABASE_URL="<Neonの接続文字列>"
$env:SEED_ADMIN_EMAIL="<管理者メール>"
$env:SEED_ADMIN_PASSWORD="<管理者パスワード>"
$env:SEED_ADMIN_NAME="ESS Admin"
npx prisma migrate deploy        # 全マイグレーションを Neon に適用
npx prisma db seed               # 初期管理者を作成
```
> 注: schema.prisma は provider=postgresql。ローカルsqlite用の `npm run db:local` とは別物。

## 3. Render（Flask API）
1. https://render.com で、このリポジトリから **Blueprint**（`render.yaml`）でデプロイ、または既存 `ess-api` を流用。
   - 既存に Render Postgres / Render の Next サービスがあれば**削除**（DBはNeon、WebはVercelへ移行のため）。
2. `ess-api` の環境変数を設定:
   - `DATABASE_URL` = Neonの接続文字列
   - `JWT_SECRET` = 後述の共有シークレット（Vercelと同一値）
   - `NEXT_PUBLIC_SITE_URL` = （Vercelの公開URL。手順5で設定）
3. デプロイ後の **Render公開URL**（`https://ess-api-xxxx.onrender.com`）を控える。

## 4. Vercel（Next.js）
1. https://vercel.com で「New Project」→ GitHubの `ess-website` を Import。
2. **Project Settings:**
   - **Root Directory** = `frontend`
   - **Settings → Build & Development → "Include files outside the Root Directory"** = **ON**（重要。`../prisma` を参照するため）
   - Install / Build コマンドは `frontend/vercel.json` に定義済み（手動設定不要）。
3. **環境変数（Environment Variables）:**
   - `DATABASE_URL` = Neonの接続文字列
   - `JWT_SECRET` = 共有シークレット（Renderと同一値）
   - `FLASK_API_BASE_URL` = 手順3のRender公開URL
   - `NEXT_PUBLIC_SITE_URL` = （Vercelの公開URL。初回デプロイ後に確定→再設定）
   - `LINE_CHANNEL_SECRET` = Messaging APIチャネルのシークレット
   - `LINE_CHANNEL_ACCESS_TOKEN` = Messaging APIの長期アクセストークン
4. Deploy → **Vercel公開URL**（`https://ess-website-xxxx.vercel.app`）を控える。

### JWT_SECRET（共有シークレット）の作り方
1つ生成して **Render と Vercel の両方に同じ値**を設定する:
```bash
# 例（OpenSSL）
openssl rand -hex 32
```

## 5. URL の相互設定（クロス参照の解消）→ 再デプロイ
1. Vercel の `NEXT_PUBLIC_SITE_URL` = Vercel公開URL を設定 → 再デプロイ。
2. Render の `NEXT_PUBLIC_SITE_URL` = Vercel公開URL を設定 → 再デプロイ（CORS許可のため）。
3. Vercel の `FLASK_API_BASE_URL` = Render公開URL になっているか確認。

## 6. LINE Webhook 設定
1. LINE Developers → Messaging APIチャネル → **Webhook設定**
   - URL = `https://<Vercel公開URL>/api/line/webhook`
   - 「Webhookの利用」= ON
2. 「**検証**」ボタン → **成功（200）** を確認。
3. （任意）応答メッセージ/あいさつメッセージは LINE Official Account Manager で調整。

## 7. 連携の動作確認（E2E）
1. 管理画面（`https://<Vercel>/dashboard/line`）で **汎用コードを1個発行**。
2. スマホで公式アカウントを**友だち追加** → 案内に従い**コードを送信**。
3. 「連携が完了しました」が返ればOK。`/dashboard/members` に新規メンバーが現れる。

---

## トラブルシュート
- **Vercelビルドで `@prisma/client` が見つからない**: Root Directory=frontend と「Include files outside Root Directory」=ON を確認。`vercel.json` の install/build が走っているか確認。
- **Prisma engine エラー（実行時）**: `schema.prisma` の `binaryTargets` に `rhel-openssl-3.0.x` があるか、`next.config.mjs` の `outputFileTracingRoot` がルートを指すか確認。
- **管理操作が最初だけ遅い/失敗**: Render無料Flaskのスリープ起床（最大~1分）。BFFが起床待ちリトライするので時間を置いて再試行。
- **CORSエラー**: Render の `NEXT_PUBLIC_SITE_URL` が Vercel の実URLと一致しているか。
- **DB接続数の枯渇（将来）**: トラフィック増時は Neon の Pooled 接続 + Prisma `directUrl` 構成へ切替。
