export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto max-w-content px-6 py-10">
        <p className="font-mono text-xs font-semibold tracking-[0.2em]">ESS</p>
        <p className="mt-2 text-sm text-ink-muted">
          英語ディスカッションサークル ESS — 英語で議論する場。
        </p>
        <p className="mt-4 font-mono text-xs text-ink-subtle" suppressHydrationWarning>
          © {year} ESS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
