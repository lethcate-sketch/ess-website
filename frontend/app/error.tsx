"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-content flex-col items-start justify-center px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-danger">Error</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">問題が発生しました</h1>
      <p className="mt-4 text-ink-muted">
        一時的なエラーの可能性があります。お手数ですが再試行してください。
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="border border-accent bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          再試行
        </button>
        <Link
          href="/"
          className="border border-line px-5 py-2 text-sm font-medium transition-colors hover:border-ink"
        >
          トップへ
        </Link>
      </div>
    </main>
  );
}
