import { cn } from "@/lib/utils";

/**
 * 写真表示の共通コンポーネント。
 * 親要素を `relative` + サイズ指定し、その中で object-cover で敷き詰める使い方を想定。
 * src はローカルパス("/images/xxx.jpg")でも外部URLでも可。
 */
type Props = {
  src: string;
  alt: string;
  className?: string;
  /** 画像の上に重ねる装飾（バッジ等） */
  overlay?: React.ReactNode;
  /** 下方向の暗いグラデーション（テキストを重ねるとき用） */
  gradient?: boolean;
};

export function Photo({ src, alt, className, overlay, gradient }: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-brand-50", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/0 to-transparent" />
      )}
      {overlay}
    </div>
  );
}
