/**
 * LINE 友だち紐付けの中核ロジック（LINE移行 M3 / [[line-migration-plan]]）。
 *
 * メンバーがトークに送った招待コードを照合し、検証済みの LINE userId を User に紐付ける。
 * LINE API 呼び出しは含めず Prisma のみに依存させ、単体テスト可能にしている
 *  （表示名の取得は呼び出し側で行い displayName として渡す）。
 */
import { prisma } from "./prisma";

export type RedeemResult =
  | { status: "already"; user: { id: string; name: string } } // 既に連携済み
  | { status: "linked"; user: { id: string; name: string } } // 既存メンバーに紐付け
  | { status: "created"; user: { id: string; name: string } } // 新規メンバー作成
  | { status: "invalid" } // コードが無い/未知/使用済み
  | { status: "expired" } // 失効
  | { status: "conflict" }; // 紐付け先が別アカウントに連携済み

/** 招待コードの正規化（前後空白除去＋大文字化）。保存時・照合時で必ず同じ関数を使う。 */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * 招待コードを照合し、LINE userId を User に紐付ける（または新規メンバー作成）。
 *
 * 競合防止: usedAt が null のトークンだけを条件付きで「使用済み」に更新し、
 * 1 件だけ更新できたときのみ紐付け処理に進む（同じコードの同時使用を弾く）。
 */
export async function redeemLinkToken(input: {
  code: string;
  lineUserId: string;
  displayName?: string;
}): Promise<RedeemResult> {
  const code = normalizeCode(input.code);
  if (!code) return { status: "invalid" };

  // 既に紐付け済みなら二重作成しない。
  const existing = await prisma.user.findUnique({
    where: { lineUserId: input.lineUserId },
    select: { id: true, name: true },
  });
  if (existing) return { status: "already", user: existing };

  const token = await prisma.lineLinkToken.findUnique({ where: { code } });
  if (!token || token.usedAt) return { status: "invalid" };
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
    return { status: "expired" };
  }

  // 競合防止つきで使用済みに更新（usedAt null のときのみ）。
  const claimed = await prisma.lineLinkToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date(), usedByLineUserId: input.lineUserId },
  });
  if (claimed.count !== 1) return { status: "invalid" }; // 競合で他が先に使用

  if (token.userId) {
    // 既存メンバー専用コード。
    const target = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { id: true, name: true, lineUserId: true },
    });
    if (!target) return { status: "invalid" };
    if (target.lineUserId && target.lineUserId !== input.lineUserId) {
      return { status: "conflict" };
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { lineUserId: input.lineUserId },
      select: { id: true, name: true },
    });
    return { status: "linked", user: updated };
  }

  // 汎用コード: 新規メンバーを作成する。
  // email は @unique 必須のため LINE 専用のダミーを採番（後で本人/管理者が変更可）。
  // passwordHash は空（パスワードレス）。Web ログインは login 側の空ハッシュガードで弾く。
  const created = await prisma.user.create({
    data: {
      email: `line_${input.lineUserId}@line.local`,
      passwordHash: "",
      name: input.displayName?.trim() || "（名称未設定）",
      role: "MEMBER",
      lineUserId: input.lineUserId,
    },
    select: { id: true, name: true },
  });
  return { status: "created", user: created };
}

/** 紐付け結果に対応する、メンバーへ返す日本語メッセージ。 */
export function messageForResult(result: RedeemResult): string {
  switch (result.status) {
    case "already":
      return `${result.user.name} さん、すでに連携済みです。`;
    case "linked":
    case "created":
      return `連携が完了しました。${result.user.name} さん、ようこそ！\nこれから出欠やアンケートをLINEで受け取れます。`;
    case "expired":
      return "この招待コードは有効期限が切れています。お手数ですが管理者に新しいコードをご確認ください。";
    case "conflict":
      return "このコードはすでに別のLINEアカウントに紐付けられています。管理者にお問い合わせください。";
    case "invalid":
    default:
      return "招待コードを確認できませんでした。コードをもう一度ご確認のうえ、そのまま送ってください。";
  }
}
