"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LOGO_SRC } from "@/lib/siteImages";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/about", label: "サークル紹介" },
  { href: "/events", label: "イベント" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/join", label: "見学・参加" },
  { href: "/contact", label: "お問い合わせ" },
];

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

/**
 * 公開ナビバー。
 * - 背景は薄いブルーの半透明（backdrop-blur）
 * - ナビ項目は丸みのある pill 型（現在地はブランド塗り）
 * - スクロールで影を付けて浮かせる
 */
export function HeaderNav({ isLoggedIn, isAdmin }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "border-b backdrop-blur-md",
        scrolled
          ? "border-line/70 bg-white/80 shadow-nav"
          : "border-transparent bg-brand-50/40",
      )}
    >
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="group flex items-center" aria-label="ESS ホーム">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="ESS English Speaking Society"
            className="h-10 w-auto transition-transform group-hover:scale-105"
          />
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-brand-gradient text-white shadow-soft"
                  : "text-ink-muted hover:bg-brand-50 hover:text-brand-600",
              )}
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-medium transition-all duration-200",
                  isActive("/mypage")
                    ? "bg-brand-gradient text-white shadow-soft"
                    : "text-ink-muted hover:bg-brand-50 hover:text-brand-600",
                )}
              >
                マイページ
              </Link>
              <Link
                href="/members"
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-medium transition-all duration-200",
                  isActive("/members")
                    ? "bg-brand-gradient text-white shadow-soft"
                    : "text-ink-muted hover:bg-brand-50 hover:text-brand-600",
                )}
              >
                メンバー
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="rounded-full px-3.5 py-1.5 font-semibold text-navy hover:bg-mint-50"
                >
                  管理
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="ml-1 inline-flex items-center rounded-full bg-brand-gradient px-4 py-1.5 font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-glow"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
