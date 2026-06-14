import { Badge } from "@/components/ui/Badge";
import { getActiveMembers } from "@/lib/members";

export const metadata = { title: "メンバー" };

export default async function MembersPage() {
  const members = await getActiveMembers();

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">メンバー</h1>
      <p className="mt-2 text-ink-muted">ESS に在籍するメンバーの一覧です。</p>

      <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div key={m.id} className="bg-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{m.name}</h2>
              {m.role === "ADMIN" && <Badge tone="accent">管理者</Badge>}
            </div>
            {m.nameKana && (
              <p className="font-mono text-xs text-ink-subtle">{m.nameKana}</p>
            )}
            {(m.grade || m.department) && (
              <p className="mt-3 text-sm text-ink-muted">
                {[m.grade, m.department].filter(Boolean).join(" ・ ")}
              </p>
            )}
            {m.bio && (
              <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{m.bio}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
