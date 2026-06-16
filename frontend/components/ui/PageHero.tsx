import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * ページ上部のヒーロー。左右いっぱい（フルブリード）に大きな活動写真を敷き、
 * 暗いグラデーションの上に見出しを重ねる。各ページで共通利用する。
 *
 * - size="tall" はトップページ向けの大きめ。
 * - children には CTA ボタン等を置ける。
 */
type Props = {
  src: string;
  alt: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  size?: "default" | "tall";
};

const SIZE = {
  default: "min-h-[17rem] sm:min-h-[21rem] lg:min-h-[25rem]",
  tall: "min-h-[26rem] sm:min-h-[32rem] lg:min-h-[38rem]",
};

export function PageHero({
  src,
  alt,
  eyebrow,
  title,
  subtitle,
  children,
  size = "default",
}: Props) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* 可読性のための暗いグラデーション */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/45 to-navy/20" />

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-content flex-col justify-end px-6 pb-12 pt-28 sm:px-10 lg:px-16 lg:pb-16",
          SIZE[size],
        )}
      >
        {eyebrow && (
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div>
        )}
      </div>
    </section>
  );
}
