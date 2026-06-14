# ESS — 英語ディスカッションサークル 公式サイト

広報サイト（公開）と管理システム（要ログイン）を備えた、サークル ESS の公式ウェブサイト。

- **設計仕様の真実源**: [`PROJECT_SPEC.md`](./PROJECT_SPEC.md)
- **常時ルール**: [`CLAUDE.md`](./CLAUDE.md)

## スタック

| 層 | 技術 |
|---|---|
| フロント/SSR | Next.js 14 (App Router, TypeScript) + Tailwind CSS |
| API | Flask (Python 3.11+) |
| スキーマ（真実源） | Prisma → SQLite（開発）/ PostgreSQL（本番） |
| Flask DBアクセス | SQLAlchemy（Prisma スキーマをミラー） |
| 認証 | JWT（Flask 発行）+ httpOnly Cookie（Next.js BFF が保持） |

## ディレクトリ構成

```
.
├── prisma/        # スキーマの真実源・マイグレーション・seed
├── frontend/      # Next.js (App Router)。.env.local はルート .env のミラー
├── backend/       # Flask API（venv は backend/venv）
├── .env / .env.example
└── docker-compose.yml
```

## セットアップ（開発）

前提: Node.js 18+ / Python 3.11+。

### 1. 環境変数

```bash
cp .env.example .env          # 値を編集（機密はコミットしない）
cp .env frontend/.env.local   # Next.js ランタイム/Edge middleware 用のミラー
```

- `JWT_SECRET` … 十分に長いランダム値（Flask が署名、Next middleware が検証）
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` … 初期管理者の資格情報
- **`frontend/.env.local`** … ルート `.env` の写し。Next.js は自プロジェクト直下の env しか確実に読まないため（特に Edge の `middleware.ts`）、必要なキーをミラーする。ルート `.env` が真実源。変更したら作り直す。`.gitignore` 済み。

### 2. Prisma（DB スキーマ・seed）

ルートで実行:

```bash
npm install
npx prisma migrate dev --name init   # SQLite に schema を反映
npx prisma db seed                   # 管理者1名 + PUBLISHEDイベント1件 + サークル情報 + 主要メンバー(ESS Admin) + サイト設定(新規登録=OFF)
```

`prisma migrate dev` は Prisma Client も生成する。生成物はルート `node_modules/@prisma/client` に置かれ、frontend は親 `node_modules` から解決して SSR で直接参照する（schema は §5 のまま、`output` を足さない）。

### 3. backend（Flask API: http://localhost:5000）

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\Activate.ps1   /   macOS・Linux: source venv/bin/activate
pip install -r requirements.txt
python wsgi.py
```

### 4. frontend（Next.js: http://localhost:3000）

```bash
cd frontend
npm install
npm run dev
```

## 主な画面

| 区分 | パス |
|---|---|
| 公開 | `/`・`/about`（サークル紹介）・`/events`・`/events/[id]`・`/events/history`・`/schedule`・`/join`・`/contact` |
| 認証 | `/login`・`/register` |
| メンバー（🔑） | `/members`・`/mypage`（`/schedule` はログイン時に出欠UIを表示） |
| 管理（👑 role=ADMIN） | `/dashboard`・`/dashboard/events`(+`/new`,`/[id]`)・`/dashboard/about`（活動内容・頻度・主要メンバーCRUD）・`/dashboard/requests`・`/dashboard/members` |

初期管理者は seed の `SEED_ADMIN_EMAIL` でログインできる。

## テスト・検証

```bash
# backend ユニット/スモーク（pytest）
backend/venv/Scripts/python.exe -m pytest backend/tests -q

# 統合スモーク（test_client。ASCII 出力）
backend/venv/Scripts/python.exe backend/tests/check_schema_parity.py   # §12-8 モデル↔DB列名一致
backend/venv/Scripts/python.exe backend/tests/check_auth_flow.py        # 認証一連
backend/venv/Scripts/python.exe backend/tests/check_member_flow.py      # メンバー機能
backend/venv/Scripts/python.exe backend/tests/check_admin_flow.py       # §12-3 / §12-6

# frontend 型・lint
cd frontend && npx tsc --noEmit && npm run lint
```

## 本番（PostgreSQL）への切替（§9）

1. `prisma/schema.prisma` の `datasource db.provider` を `"postgresql"` に変更
2. `.env` の `DATABASE_URL` を PostgreSQL 接続文字列へ（`docker compose up -d db` で起動可）
3. `npx prisma migrate deploy`
4. Flask は `config.py` が同じ `DATABASE_URL` を参照（コード変更不要。`file:` は SQLite、それ以外は接続文字列として扱う）

移植性の事前確認（PG サーバ不要・オフライン）:

```bash
# provider=postgresql のコピーで DDL 生成を確認（enum 不使用＝素直に移植可能）
npx prisma migrate diff --from-empty --to-schema-datamodel <postgresql版schema> --script
```

## 設計上の重要判断（厳守 / §3）

1. Prisma がスキーマの単一の真実源。マイグレーションは Prisma Migrate。
2. Flask の SQLAlchemy モデルは Prisma の `@@map`/`@map`（snake_case のテーブル/列名）に一致。属性名は Prisma フィールド（camelCase）。
3. SQLite では enum を使わず `String` + デフォルト値（許可値は `backend/app/utils` の `ALLOWED_VALUES` とアプリ層バリデーション）。
4. JWT はブラウザ JS に晒さず httpOnly Cookie に格納し、Next.js BFF（`app/api/auth/*`・`app/api/proxy/*`）経由で Flask に中継。
5. 公開ページの読み取りは Next.js が Prisma Client で直接参照。書き込み・業務ロジックは必ず Flask 経由。
6. 日時は UTC 保存・表示時にローカル変換。Prisma は SQLite に DateTime を整数ms で保存するため、Flask は `PrismaDateTime`（`backend/app/models/types.py`）で整数ms⇄aware UTC を相互変換する。

## 補足

- **`/schedule` の統合**: §4 は公開とメンバーの 2 つの `schedule` ページを示すが URL が衝突するため、単一の `/schedule`（公開カレンダー＋ログイン時に出欠UI）に統合した。
- **新規登録の受付トグル**: 部外者の登録防止のため `SiteSetting.registrationEnabled`（既定 **OFF**）で制御。`/dashboard/members` のトグルで切替。OFF 時はログインの「新規登録」リンク非表示・`/register` 閉鎖・登録API `403 REGISTRATION_DISABLED`（UIだけでなくAPIでも拒否）。
