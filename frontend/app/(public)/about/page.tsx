import Link from "next/link";

import { getCircleInfo, getKeyMembers } from "@/lib/circle";

export const metadata = { title: "サークル紹介" };

export default async function AboutPage() {
  const [info, members] = await Promise.all([getCircleInfo(), getKeyMembers()]);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">About ESS</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">サークル紹介</h1>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-subtle">活動内容</h2>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">
          {info?.about ?? "（準備中）"}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-subtle">活動頻度</h2>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">
          {info?.frequency ?? "（準備中）"}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">主要メンバー</h2>
        {members.length > 0 ? (
          <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className="bg-surface p-5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
                  {m.role}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{m.name}</h3>
                {m.bio && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.bio}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-muted">準備中です。</p>
        )}
      </section>

      <div className="mt-12 border-t border-line pt-6">
        <Link
          href="/join"
          className="border border-accent bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          見学・参加を申し込む
        </Link>
      </div>
    </main>
  );
}
