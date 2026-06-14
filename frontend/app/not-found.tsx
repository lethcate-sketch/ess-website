import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-content flex-col items-start justify-center px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">ページが見つかりません</h1>
      <p className="mt-4 text-ink-muted">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/"
        className="mt-8 border border-accent bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
      >
        トップへ戻る
      </Link>
    </main>
  );
}
