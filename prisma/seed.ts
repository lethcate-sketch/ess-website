import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * seed: 最低限、role=ADMIN の初期ユーザー1名と PUBLISHED のサンプルイベント1件を投入する（§10）。
 * 認証情報は .env（SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD）から読み込み、ソースに平文を残さない。
 * パスワードは bcrypt でハッシュ化（Flask の Python bcrypt と相互検証可能）。
 */
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "ESS Admin";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL と SEED_ADMIN_PASSWORD を .env に設定してください。"
    );
  }
  if (["change-me", "__PENDING__", ""].includes(password)) {
    throw new Error(
      "SEED_ADMIN_PASSWORD がプレースホルダのままです。実際のパスワードを .env に設定してから再実行してください。"
    );
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", name, isActive: true },
    create: {
      email,
      passwordHash,
      name,
      role: "ADMIN",
    },
  });

  // PUBLISHED のサンプルイベント1件（固定IDで冪等に）
  const sampleEventId = "00000000-0000-4000-8000-000000000001";
  const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1週間後
  startAt.setUTCHours(9, 0, 0, 0); // 18:00 JST = 09:00 UTC（UTCで保存）
  const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000); // +2h

  await prisma.event.upsert({
    where: { id: sampleEventId },
    update: {
      title: "ESS Weekly Discussion #1",
      status: "PUBLISHED",
      isPublic: true,
    },
    create: {
      id: sampleEventId,
      title: "ESS Weekly Discussion #1",
      description:
        "今週のテーマ:「AI と私たちの未来」。レベル別グループに分かれて英語で自由に議論します。初参加・見学歓迎。",
      type: "REGULAR",
      startAt,
      endAt,
      location: "学生会館 3F ミーティングルーム",
      capacity: 30,
      status: "PUBLISHED",
      isPublic: true,
      createdById: admin.id,
    },
  });

  // CircleInfo（シングルトン）— 活動内容・活動頻度の初期値（後で管理画面から編集可能）
  await prisma.circleInfo.upsert({
    where: { id: "default" },
    update: {}, // 既存があれば保持（ユーザーの編集を上書きしない）
    create: {
      id: "default",
      about:
        "ESS は英語ディスカッションサークルです。毎回テーマを設定し、レベル別の少人数グループに分かれて英語で議論します。スピーチやディベート企画、外部サークルとの交流会も実施します。（初期設定 — 後で管理画面から編集してください）",
      frequency:
        "毎週 水曜・土曜（週2回）/ 各回 18:00–19:30（初期設定 — 後で管理画面から編集してください）",
    },
  });

  // 主要メンバー（初期 = ESS Admin / サークルリーダー）
  const leaderId = "00000000-0000-4000-8000-000000000002";
  await prisma.keyMember.upsert({
    where: { id: leaderId },
    update: {}, // 既存は保持
    create: {
      id: leaderId,
      name: admin.name,
      role: "サークルリーダー",
      bio: "ESS の代表。活動の企画・運営を担当します。（初期設定 — 後で編集してください）",
      orderIndex: 0,
    },
  });

  // サイト設定（シングルトン）— 新規登録の受付は既定 OFF（必要時に管理画面で ON）
  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {}, // 既存は保持（管理者の設定を上書きしない）
    create: { id: "default", registrationEnabled: false },
  });

  console.log(`Seeded admin user : ${admin.email} (role=${admin.role})`);
  console.log(`Seeded sample event: ${sampleEventId} (status=PUBLISHED)`);
  console.log(`Seeded circle info + key member (leader=${admin.name})`);
  console.log(`Seeded site setting (registrationEnabled=false)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
