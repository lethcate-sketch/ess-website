import { LineTokenManager } from "@/components/admin/LineTokenManager";
import { getAllUsers, getLineLinkTokens } from "@/lib/admin";

export const metadata = { title: "LINE招待コード" };

export default async function AdminLinePage() {
  const [tokens, users] = await Promise.all([getLineLinkTokens(), getAllUsers()]);

  // Date は ISO 文字列にしてクライアントへ渡す（既存ページの作法に合わせる）。
  const tokenView = tokens.map((t) => ({
    id: t.id,
    code: t.code,
    userId: t.userId,
    targetName: t.targetName,
    note: t.note,
    expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
    usedAt: t.usedAt ? t.usedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  const memberView = users
    .filter((u) => u.isActive)
    .map((u) => ({ id: u.id, name: u.name, linked: Boolean(u.lineUserId) }));

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">LINE招待コード</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        メンバーがLINEで連携するための招待コードを発行します。メンバーは公式アカウントを友だち追加し、
        受け取ったコードをトークに送ると連携が完了します。「汎用コード」は誰でも使え（先着1名で新規メンバー作成）、
        「個別コード」は指定したメンバー本人の紐付け専用です。
      </p>

      <div className="mt-8">
        <LineTokenManager tokens={tokenView} members={memberView} />
      </div>
    </main>
  );
}
