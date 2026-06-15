import { Badge } from "@/components/ui/Badge";
import { getActiveMembers } from "@/lib/members";

export const metadata = { title: "メンバー" };

export default async function MembersPage() {
  const members = await getActiveMembers();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy">メンバー</h1>
      <p className="mt-2 text-ink-muted">ESS に在籍するメンバーの一覧です。</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="rounded-3xl border border-line/70 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-2 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/avatar/${m.id}`}
                  alt={m.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-navy">{m.name}</h2>
                  {m.role === "ADMIN" && <Badge tone="accent">管理者</Badge>}
                </div>
                {m.nameKana && (
                  <p className="text-xs text-ink-subtle">{m.nameKana}</p>
                )}
              </div>
            </div>

            {(m.grade || m.department) && (
              <p className="mt-4 text-sm text-ink-muted">
                {[m.grade, m.department].filter(Boolean).join(" ・ ")}
              </p>
            )}
            {m.bio && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                {m.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
