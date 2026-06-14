import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/LoginForm";
import { getSession } from "@/lib/auth";
import { getSiteSetting } from "@/lib/settings";

export const metadata = { title: "ログイン" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next =
    typeof searchParams.next === "string" && searchParams.next.startsWith("/")
      ? searchParams.next
      : undefined;

  // ログイン済みはリダイレクト（§7）
  if (await getSession()) redirect(next ?? "/mypage");

  // 新規登録の受付（管理者がON/OFF。既定OFF=部外者対策）
  const { registrationEnabled } = await getSiteSetting();

  return (
    <div className="border border-line p-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">ESS</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">ログイン</h1>
      <div className="mt-6">
        <LoginForm next={next} />
      </div>
      {registrationEnabled && (
        <p className="mt-6 text-sm text-ink-muted">
          アカウントがない場合は{" "}
          <Link className="text-accent hover:underline" href="/register">
            新規登録
          </Link>
        </p>
      )}
    </div>
  );
}
