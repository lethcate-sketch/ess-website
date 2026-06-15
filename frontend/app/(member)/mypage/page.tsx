import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/forms/ProfileForm";
import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { UserIcon } from "@/components/ui/Icons";
import { getSession } from "@/lib/auth";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";
import { getUserAttendance, getUserById } from "@/lib/members";

export const metadata = { title: "マイページ" };

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/mypage");
  const user = await getUserById(session.sub);
  if (!user) redirect("/login");
  const attendance = await getUserAttendance(user.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-2 ring-line">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-brand-300">
              <UserIcon className="h-8 w-8" />
            </span>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-navy">
            マイページ
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.email}
            {user.role === "ADMIN" ? " ・ 管理者" : ""}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">登録情報の変更</h2>
        <div className="mt-4">
          <ProfileForm
            initial={{
              name: user.name,
              nameKana: user.nameKana,
              grade: user.grade,
              department: user.department,
              bio: user.bio,
              avatarUrl: user.avatarUrl,
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">出欠履歴</h2>
        {attendance.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {attendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/events/${a.eventId}`}
                    className="font-medium hover:text-accent"
                  >
                    {a.event.title}
                  </Link>
                  <DateTime
                    value={a.event.startAt.toISOString()}
                    dateOnly
                    className="ml-3 font-mono text-xs text-ink-subtle"
                  />
                </div>
                <Badge>{ATTENDANCE_STATUS_LABEL[a.status] ?? a.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">
            出欠の記録はまだありません。{" "}
            <Link href="/schedule" className="text-accent hover:underline">
              スケジュール
            </Link>{" "}
            から登録できます。
          </p>
        )}
      </section>
    </main>
  );
}
