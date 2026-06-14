# PROJECT_SPEC.md — 英語ディスカッションサークル公式サイト

> このファイルは Claude Code がプロジェクト一式をスキャフォールドするための**実装仕様書**です。
> 記載された構成・スキーマ・命名・制約に厳密に従ってください。判断に迷う箇所は本書の「設計上の重要判断」を優先します。

---

## 1. プロジェクト概要

英語ディスカッションサークルの公式ウェブサイト。2つの役割を持つ。

- **広報サイト（公開）**: イベント告知 / イベント履歴 / スケジュール閲覧 / 見学・参加申し込み / 質問フォーム
- **管理システム（要ログイン）**: メンバー情報閲覧 / マイページ / 出欠・参加アンケート / 管理者ダッシュボード

---

## 2. 技術スタック

| 層 | 技術 | 役割 |
|---|---|---|
| フロント/SSR | Next.js 14+（App Router, TypeScript） | UI・SSR/SSG・Server Components |
| スタイル | Tailwind CSS | ミニマル/直線的/IT系デザイン |
| API | Flask（Python 3.11+） | 認証・出欠・イベント・フォーム受付 |
| ORM(スキーマ) | Prisma | DBスキーマ定義・マイグレーション（**真実源**） |
| ORM(Flask側) | SQLAlchemy | FlaskからのDBアクセス（Prismaスキーマをミラー） |
| DB | SQLite（開発） → PostgreSQL（本番） | データ永続化 |
| 認証 | JWT（Flask発行）+ httpOnly Cookie（Next.js保持） | — |

---

## 3. 設計上の重要判断（必読・厳守）

1. **Prisma がスキーマの単一の真実源**。`prisma/schema.prisma` を正とし、マイグレーションは Prisma Migrate で行う。
2. **Flask は SQLAlchemy で同一DBにアクセス**する。SQLAlchemy モデルは Prisma スキーマと**フィールド名・テーブル名を一致**させる（`@@map` / `@map` を使い snake_case のDB列名に揃える）。
3. **SQLite は Prisma の `enum` 型を未サポート**。そのため**enum は使わず `String` 型 + デフォルト値**で表現し、許可値はコメントとアプリ層バリデーションで管理する。これにより SQLite↔PostgreSQL のスキーマ差異をなくす。
4. **認証トークンはブラウザJSに晒さない**。Flask が発行する JWT は Next.js の Route Handler（BFF）経由で **httpOnly Cookie** に格納し、サーバ側で付与して Flask に中継する。
5. **読み取り中心の公開ページ・一覧表示は Next.js が Prisma Client で直接DB参照**（SSR/SSG）。**書き込み・業務ロジックは必ず Flask API 経由**。
6. **DB列・テーブルは snake_case、TS/Prismaモデルフィールドは camelCase**。
7. 日時は **UTCで保存**し、表示時にクライアントでローカル変換する。

---

## 4. フォルダ構成

```
english-circle/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── frontend/                      # Next.js (App Router)
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                 # トップ（広報）
│   │   │   ├── events/
│   │   │   │   ├── page.tsx             # イベント告知一覧
│   │   │   │   ├── history/page.tsx     # イベント履歴
│   │   │   │   └── [id]/page.tsx        # イベント詳細
│   │   │   ├── schedule/page.tsx        # スケジュールカレンダー（公開閲覧）
│   │   │   ├── join/page.tsx            # 見学・参加申し込みフォーム
│   │   │   └── contact/page.tsx         # 質問フォーム
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (member)/
│   │   │   ├── members/page.tsx         # メンバー情報閲覧（要ログイン）
│   │   │   ├── mypage/page.tsx          # 登録情報の閲覧・変更
│   │   │   └── schedule/page.tsx        # メンバー用スケジュール＋出欠
│   │   ├── (admin)/
│   │   │   └── dashboard/page.tsx       # 管理者ダッシュボード
│   │   ├── api/                         # Route Handlers (BFF)
│   │   │   ├── auth/[...]/route.ts      # Cookie管理・Flask中継
│   │   │   └── proxy/[...path]/route.ts # JWT付与してFlaskへ中継
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── middleware.ts                    # 保護ルートの認可
│   ├── components/
│   │   ├── ui/                          # Button/Input/Card 等の最小部品
│   │   ├── layout/                      # Header/Footer/Nav
│   │   ├── events/                      # EventCard/Calendar 等
│   │   └── forms/                       # 各種フォーム
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma Client（SSR読み取り用）
│   │   ├── api.ts                       # Flask呼び出しラッパー
│   │   ├── auth.ts                      # JWT/Cookie ヘルパー
│   │   └── utils.ts
│   ├── types/
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
├── backend/                       # Flask API
│   ├── app/
│   │   ├── __init__.py                  # create_app / CORS / JWT
│   │   ├── config.py                    # 開発/本番 設定切替
│   │   ├── extensions.py                # db, jwt 等
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── event.py
│   │   │   ├── attendance.py
│   │   │   ├── survey.py
│   │   │   └── form.py
│   │   ├── routes/                      # Blueprint
│   │   │   ├── auth.py
│   │   │   ├── members.py
│   │   │   ├── events.py
│   │   │   ├── attendance.py
│   │   │   ├── survey.py
│   │   │   ├── forms.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   ├── schemas/                     # 入出力バリデーション
│   │   └── utils/                       # 認可デコレータ等
│   ├── tests/
│   ├── requirements.txt
│   └── wsgi.py
├── .env.example
├── docker-compose.yml             # 本番PostgreSQL（任意）
└── README.md
```

---

## 5. Prisma スキーマ（`prisma/schema.prisma`）

> enum を使わず String で表現（SQLite対応）。許可値は各フィールドのコメント参照。
> 本番切替は §9 を参照。

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // 本番は "postgresql" に変更（§9参照）
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  nameKana     String?  @map("name_kana")
  role         String   @default("MEMBER") // MEMBER | ADMIN
  grade        String?
  department   String?
  bio          String?
  avatarUrl    String?  @map("avatar_url")
  isActive     Boolean  @default(true) @map("is_active")
  joinedAt     DateTime @default(now()) @map("joined_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  attendances     Attendance[]
  surveyResponses EventSurveyResponse[]
  createdEvents   Event[]               @relation("EventCreatedBy")
  refreshTokens   RefreshToken[]

  @@map("users")
}

model Event {
  id          String   @id @default(uuid())
  title       String
  description String?
  type        String   @default("REGULAR") // REGULAR | SPECIAL | SOCIAL | EXTERNAL
  startAt     DateTime @map("start_at")
  endAt       DateTime @map("end_at")
  location    String?
  capacity    Int?
  status      String   @default("DRAFT") // DRAFT | PUBLISHED | CLOSED | ARCHIVED
  isPublic    Boolean  @default(true) @map("is_public")
  createdById String   @map("created_by_id")
  createdBy   User     @relation("EventCreatedBy", fields: [createdById], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  attendances           Attendance[]
  surveyQuestions       EventSurveyQuestion[]
  participationRequests ParticipationRequest[]

  @@map("events")
}

model Attendance {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  eventId     String   @map("event_id")
  status      String   @default("UNDECIDED") // ATTENDING | ABSENT | UNDECIDED | LATE
  comment     String?
  respondedAt DateTime @default(now()) @map("responded_at")

  user  User  @relation(fields: [userId], references: [id])
  event Event @relation(fields: [eventId], references: [id])

  @@unique([userId, eventId])
  @@map("attendances")
}

model EventSurveyQuestion {
  id           String  @id @default(uuid())
  eventId      String  @map("event_id")
  questionText String  @map("question_text")
  inputType    String  @default("TEXT") @map("input_type") // TEXT | SINGLE | MULTI | SCALE
  options      String? // JSON文字列で選択肢を保持
  required     Boolean @default(false)
  orderIndex   Int     @default(0) @map("order_index")

  event     Event                 @relation(fields: [eventId], references: [id])
  responses EventSurveyResponse[]

  @@map("event_survey_questions")
}

model EventSurveyResponse {
  id           String   @id @default(uuid())
  questionId   String   @map("question_id")
  userId       String   @map("user_id")
  answerText   String?  @map("answer_text")
  answerChoice String?  @map("answer_choice") // JSON文字列で複数選択対応
  createdAt    DateTime @default(now()) @map("created_at")

  question EventSurveyQuestion @relation(fields: [questionId], references: [id])
  user     User                @relation(fields: [userId], references: [id])

  @@map("event_survey_responses")
}

model ParticipationRequest {
  id        String   @id @default(uuid())
  eventId   String?  @map("event_id")
  name      String
  email     String
  type      String   @default("TRIAL") // TRIAL | JOIN
  message   String?
  status    String   @default("NEW") // NEW | CONTACTED | DONE
  createdAt DateTime @default(now()) @map("created_at")

  event Event? @relation(fields: [eventId], references: [id])

  @@map("participation_requests")
}

model ContactInquiry {
  id        String   @id @default(uuid())
  name      String
  email     String
  subject   String
  message   String
  status    String   @default("NEW") // NEW | REPLIED | CLOSED
  createdAt DateTime @default(now()) @map("created_at")

  @@map("contact_inquiries")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("refresh_tokens")
}
```

---

## 6. API エンドポイント仕様（Flask）

権限凡例: 🔓公開 / 🔑要ログイン / 👑管理者のみ
ベースURL: `http://localhost:5000`（開発）

### 認証 `/api/auth`
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| POST | `/api/auth/register` | 🔓 | 登録。body: `{email, password, name, nameKana?, grade?, department?}` |
| POST | `/api/auth/login` | 🔓 | ログイン。アクセスJWT + リフレッシュトークン返却 |
| POST | `/api/auth/logout` | 🔑 | リフレッシュトークン失効 |
| POST | `/api/auth/refresh` | 🔓※ | アクセストークン再発行（リフレッシュトークン検証） |
| GET | `/api/auth/me` | 🔑 | 現在のユーザー |

### メンバー `/api/members` `/api/me`
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| GET | `/api/members` | 🔑 | メンバー一覧 |
| GET | `/api/members/:id` | 🔑 | メンバー詳細 |
| GET | `/api/me` | 🔑 | マイページ情報 |
| PATCH | `/api/me` | 🔑 | 登録情報変更 |
| GET | `/api/me/attendance` | 🔑 | 自分の出欠履歴 |

### イベント `/api/events`
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| GET | `/api/events` | 🔓 | 公開イベント一覧（告知） |
| GET | `/api/events/upcoming` | 🔓 | カレンダー用の今後の予定 |
| GET | `/api/events/history` | 🔓 | 過去イベント履歴 |
| GET | `/api/events/:id` | 🔓 | イベント詳細 |
| POST | `/api/events` | 👑 | イベント作成 |
| PATCH | `/api/events/:id` | 👑 | イベント編集 |
| DELETE | `/api/events/:id` | 👑 | 削除/アーカイブ |

### 出欠 `/api/events/:id/attendance`
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| POST | `/api/events/:id/attendance` | 🔑 | 自分の出欠登録 |
| PATCH | `/api/events/:id/attendance` | 🔑 | 自分の出欠更新 |
| GET | `/api/events/:id/attendance` | 👑 | 出欠集計取得 |

### 参加アンケート `/api/events/:id/survey`
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| GET | `/api/events/:id/survey` | 🔑 | 設問取得 |
| POST | `/api/events/:id/survey/responses` | 🔑 | 回答送信 |
| GET | `/api/events/:id/survey/responses` | 👑 | 回答集計 |
| POST | `/api/events/:id/survey/questions` | 👑 | 設問作成 |

### 公開フォーム
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| POST | `/api/participation-requests` | 🔓 | 見学・参加申し込み |
| GET | `/api/participation-requests` | 👑 | 申し込み一覧 |
| PATCH | `/api/participation-requests/:id` | 👑 | 対応ステータス更新 |
| POST | `/api/contact` | 🔓 | 質問フォーム送信 |
| GET | `/api/contact` | 👑 | 問い合わせ一覧 |
| PATCH | `/api/contact/:id` | 👑 | 対応ステータス更新 |

### 管理者ダッシュボード `/api/admin`
| Method | Path | 権限 | 説明 |
|---|---|---|---|
| GET | `/api/admin/dashboard` | 👑 | サマリ統計（人数/出欠率/未対応件数） |
| GET | `/api/admin/members` | 👑 | メンバー管理一覧 |
| PATCH | `/api/admin/members/:id/role` | 👑 | 権限変更（MEMBER↔ADMIN） |
| PATCH | `/api/admin/members/:id/status` | 👑 | 在籍状態の有効/無効化 |

※ `refresh` は httpOnly Cookie のリフレッシュトークンで認証するため公開扱い。

**共通レスポンス規約**
- 成功: `200/201` + JSON、エラー: `{ "error": { "code": "...", "message": "..." } }`
- バリデーションエラーは `422`、認証なしは `401`、権限不足は `403`。

---

## 7. 画面ルーティングと認可

| パス | 区分 | 認可 |
|---|---|---|
| `/` `/events` `/events/history` `/events/[id]` `/schedule` `/join` `/contact` | 公開 | なし |
| `/login` `/register` | 認証 | なし（ログイン済はリダイレクト） |
| `/members` `/mypage` `/(member)/schedule` | メンバー | 🔑 |
| `/dashboard` | 管理 | 👑 |

`middleware.ts` で Cookie の JWT を検証し、`(member)` / `(admin)` グループを保護。`(admin)` は role=ADMIN を要求。

---

## 8. デザインシステム指針（ミニマル・直線的・IT系）

- **配色**: ニュートラル基調（白〜濃グレー）+ アクセント1色（例: インディゴ系）。多色使いを避ける。
- **角丸**: ゼロ〜極小（`rounded-none` / `rounded-sm`）。直線的な印象を優先。
- **余白**: 広め。コンテンツ幅は `max-w-5xl`〜`max-w-6xl` 中央寄せ。
- **タイポ**: サンセリフ本文 + 見出しや数値に等幅（`font-mono`）を併用しIT系の質感を出す。
- **罫線**: 1px の薄いボーダーで区切る。影は控えめ。
- **コンポーネント**: `components/ui` に Button / Input / Card / Table / Badge を最小実装。Tailwind のデザイントークンを `tailwind.config.ts` に集約。

---

## 9. 環境変数とDB切替

`.env.example` を生成し、以下を含める。

```
# 開発（SQLite）
DATABASE_URL="file:./dev.db"
# 本番（PostgreSQL）
# DATABASE_URL="postgresql://user:pass@host:5432/english_circle"

JWT_SECRET="change-me"
JWT_ACCESS_EXPIRES_MIN=15
JWT_REFRESH_EXPIRES_DAYS=14

FLASK_API_BASE_URL="http://localhost:5000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**本番（PostgreSQL）への切替手順**（Prisma は `provider` を env で切り替えられないため明示手順とする）:
1. `schema.prisma` の `datasource db.provider` を `"postgresql"` に変更。
2. `DATABASE_URL` を PostgreSQL 接続文字列へ。
3. `npx prisma migrate deploy` を実行。
4. Flask 側 `config.py` の `SQLALCHEMY_DATABASE_URI` も同じ `DATABASE_URL` を参照。

---

## 10. セットアップ手順（Claude Code が実行する初期化）

```bash
# 1. ルート初期化
mkdir english-circle && cd english-circle

# 2. Prisma
npm init -y
npm install prisma --save-dev && npm install @prisma/client
npx prisma init --datasource-provider sqlite
# schema.prisma を §5 の内容に置換
npx prisma migrate dev --name init
npx prisma db seed   # seed.ts で管理者1名+サンプルイベントを投入

# 3. frontend (Next.js)
npx create-next-app@latest frontend --typescript --tailwind --app --eslint
# §4 の構成・ページ・lib・middleware を実装

# 4. backend (Flask)
cd backend
python -m venv venv && source venv/bin/activate
pip install flask flask-cors flask-jwt-extended sqlalchemy pydantic python-dotenv
# 本番用: pip install psycopg2-binary gunicorn
pip freeze > requirements.txt
# §4 の models/routes/services/schemas を実装
```

`prisma/seed.ts` は最低限、role=ADMIN の初期ユーザー（email/パスワードは環境変数または固定値）と PUBLISHED 状態のサンプルイベントを1件作成すること。

---

## 11. 実装順序（マイルストーン）

1. **基盤**: Prisma スキーマ + マイグレーション + seed、`.env.example`、Flask `create_app`、Next.js 雛形。
2. **認証**: Flask `/api/auth/*`（JWT・bcrypt）→ Next.js BFF（Cookie）→ middleware → login/register 画面。
3. **公開広報**: トップ / イベント一覧・詳細・履歴 / スケジュール（Next.js から Prisma 直読み or Flask GET）。
4. **公開フォーム**: 申し込み `/join`・質問 `/contact`（Flask POST）。
5. **メンバー機能**: メンバー一覧 / マイページ閲覧・更新 / 出欠登録 / 参加アンケート回答。
6. **管理機能**: イベントCRUD / 出欠・アンケート集計 / 申し込み・問い合わせ対応 / ダッシュボード統計 / 権限管理。
7. **仕上げ**: デザイントークン統一、レスポンシブ、エラーハンドリング、最低限のテスト。

---

## 12. 受け入れ基準（完了条件）

- [ ] `npx prisma migrate dev` が SQLite で成功し、seed が通る。
- [ ] 未ログインで `/dashboard` `/mypage` `/members` にアクセスすると `/login` へリダイレクトされる。
- [ ] 一般ユーザーが管理者APIを叩くと `403` を返す。
- [ ] JWT がブラウザの JS から読めない（httpOnly Cookie）。
- [ ] 公開ページが未ログインで閲覧でき、申し込み・質問フォームが送信できる。
- [ ] イベント作成（管理）→ 公開告知に反映 → メンバーが出欠登録 → 管理画面で集計、まで一連が動く。
- [ ] `provider` を `postgresql` に変えて `DATABASE_URL` を差し替えるだけで本番向けマイグレーションが通る。
- [ ] Flask の SQLAlchemy モデルのテーブル/列名が Prisma の `@@map`/`@map` と一致している。
```
