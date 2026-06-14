import Link from "next/link";

export function FormSuccess({ title, message }: { title: string; message: string }) {
  return (
    <div className="border border-accent bg-accent-subtle p-6">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      <Link
        href="/"
        className="mt-4 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← トップへ戻る
      </Link>
    </div>
  );
}
