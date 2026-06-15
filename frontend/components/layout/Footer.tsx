import Link from "next/link";

import { GlobeIcon } from "@/components/ui/Icons";

const LINKS = [
  { href: "/about", label: "サークル紹介" },
  { href: "/events", label: "イベント" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/join", label: "見学・参加" },
  { href: "/contact", label: "お問い合わせ" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24">
      {/* 上部の細いグラデーション帯 */}
      <div className="h-1 w-full bg-sky-gradient" />
      <div className="bg-white">
        <div className="mx-auto max-w-content px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient font-display text-sm font-extrabold text-white shadow-soft">
                  E
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight text-navy">
                  ESS
                </span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm leading-relaxed text-ink-muted">
                <GlobeIcon className="h-4 w-4 shrink-0 text-brand-400" />
                英語ディスカッションサークル ESS — 世界とつながり、英語で議論する場。
              </p>
            </div>

            <nav className="flex flex-col gap-2 text-sm">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-ink-muted transition-colors hover:text-brand-600"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <p
            className="mt-10 border-t border-line/70 pt-6 font-display text-xs text-ink-subtle"
            suppressHydrationWarning
          >
            © {year} ESS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
