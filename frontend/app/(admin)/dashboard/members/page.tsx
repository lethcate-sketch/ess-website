import { MemberControls } from "@/components/admin/MemberControls";
import { RegistrationToggle } from "@/components/admin/RegistrationToggle";
import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { getAllUsers } from "@/lib/admin";
import { getSiteSetting } from "@/lib/settings";

export const metadata = { title: "メンバー管理" };

export default async function AdminMembersPage() {
  const [users, setting] = await Promise.all([getAllUsers(), getSiteSetting()]);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">メンバー管理</h1>
      <p className="mt-2 text-ink-muted">権限（MEMBER/ADMIN）と在籍状態を管理します。</p>

      <div className="mt-8">
        <RegistrationToggle enabled={setting.registrationEnabled} />
      </div>

      <div className="mt-8 overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-muted text-left font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3">氏名</th>
              <th className="px-4 py-3">メール</th>
              <th className="px-4 py-3">入会</th>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <DateTime value={u.joinedAt.toISOString()} dateOnly className="font-mono text-xs text-ink-muted" />
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <Badge tone={u.role === "ADMIN" ? "accent" : "neutral"}>
                      {u.role === "ADMIN" ? "管理者" : "在籍"}
                    </Badge>
                  ) : (
                    <Badge tone="muted">無効</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <MemberControls userId={u.id} role={u.role} isActive={u.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
