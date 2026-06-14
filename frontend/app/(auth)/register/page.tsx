import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/forms/RegisterForm";
import { getSession } from "@/lib/auth";
import { getSiteSetting } from "@/lib/settings";

export const metadata = { title: "新規登録" };

export default async function RegisterPage() {
  // ログイン済みはリダイレクト（§7）
  if (await getSession()) redirect("/mypage");

  // 受付OFFのときはフォームを出さない（API も 403 で拒否 / 部外者対策）
  const { registrationEnabled } = await getSiteSetting();

  return (
    <div className="border border-line p-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">ESS</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">新規登録</h1>
      {registrationEnabled ? (
        <div className="mt-6">
          <RegisterForm />
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">
          現在、新規登録は受け付けていません。見学・参加をご希望の方は{" "}
          <Link className="text-accent hover:underline" href="/join">
            見学・参加フォーム
          </Link>{" "}
          からお問い合わせください。
        </p>
      )}
      <p className="mt-6 border-t border-line pt-6 text-sm text-ink-muted">
        既にアカウントをお持ちの場合は{" "}
        <Link className="text-accent hover:underline" href="/login">
          ログイン
        </Link>
      </p>
    </div>
  );
}
