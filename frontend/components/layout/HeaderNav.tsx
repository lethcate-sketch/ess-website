"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
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
 * - 背景は薄いブルーの半透明（backdrop-blur）、スクロールで影を付けて浮かせる
 * - PC: 丸い pill 型ナビを横並び
 * - スマホ: ハンバーガーで開閉するメニュー（主アクセスがスマホのため）
 */
export function HeaderNav({ isLoggedIn, isAdmin }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ページ遷移したらメニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const links = [
    ...NAV,
    ...(isLoggedIn
      ? [
          { href: "/mypage", label: "マイページ" },
          { href: "/members", label: "メンバー" },
        ]
      : []),
    ...(isLoggedIn && isAdmin ? [{ href: "/dashboard", label: "管理" }] : []),
  ];

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full px-3.5 py-1.5 font-medium transition-all duration-200",
      active
        ? "bg-brand-gradient text-white shadow-soft"
        : "text-ink-muted hover:bg-brand-50 hover:text-brand-600",
    );

  const rowClass = (active: boolean) =>
    cn(
      "rounded-xl px-4 py-3 text-base font-medium transition-colors",
      active
        ? "bg-brand-gradient text-white shadow-soft"
        : "text-ink hover:bg-brand-50 hover:text-brand-600",
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        "border-b backdrop-blur-md",
        scrolled || open
          ? "border-line/70 bg-white/85 shadow-nav"
          : "border-transparent bg-brand-50/40",
      )}
    >
      <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-5 py-3 sm:px-6">
        <Link href="/" className="group flex items-center" aria-label="ESS ホーム">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="ESS English Speaking Society"
            className="h-[4.5rem] w-auto transition-transform group-hover:scale-105 sm:h-20"
          />
        </Link>

        {/* PC: 横並びナビ */}
        <nav className="hidden items-center gap-1 text-sm lg:flex">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={pillClass(isActive(item.href))}>
              {item.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="ml-1 inline-flex items-center rounded-full bg-brand-gradient px-4 py-1.5 font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-glow"
            >
              ログイン
            </Link>
          )}
        </nav>

        {/* スマホ: ハンバーガー */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-brand-50 lg:hidden"
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* スマホ: 開閉メニュー */}
      {open && (
        <nav className="border-t border-line/70 bg-white/95 px-4 pb-4 pt-2 backdrop-blur lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className={rowClass(isActive(item.href))}>
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-line/60 pt-3">
              {isLoggedIn ? (
                <LogoutButton />
              ) : (
                <Link
                  href="/login"
                  className="block rounded-full bg-brand-gradient px-4 py-3 text-center text-base font-semibold text-white shadow-soft"
                >
                  ログイン
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
