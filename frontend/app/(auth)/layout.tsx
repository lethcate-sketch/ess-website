import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block font-mono text-xs uppercase tracking-[0.2em] text-ink-muted hover:text-accent"
      >
        ← ESS トップ
      </Link>
      {children}
    </main>
  );
}
