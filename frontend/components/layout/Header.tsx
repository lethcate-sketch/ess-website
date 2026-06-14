import Link from "next/link";

import { getSession } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/about", label: "サークル紹介" },
  { href: "/events", label: "イベント" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/join", label: "見学・参加" },
  { href: "/contact", label: "お問い合わせ" },
];

export async function Header() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-mono text-sm font-semibold tracking-[0.2em]">
          ESS
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link href="/mypage" className="text-ink-muted transition-colors hover:text-ink">
                マイページ
              </Link>
              <Link href="/members" className="text-ink-muted transition-colors hover:text-ink">
                メンバー
              </Link>
              {isAdmin && (
                <Link href="/dashboard" className="text-accent hover:underline">
                  管理
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="border border-accent bg-accent px-3 py-1.5 text-accent-fg transition-colors hover:bg-accent-hover"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
