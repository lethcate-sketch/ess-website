import { AddKeyMemberForm } from "@/components/admin/AddKeyMemberForm";
import { CircleInfoForm } from "@/components/admin/CircleInfoForm";
import { KeyMemberRow } from "@/components/admin/KeyMemberRow";
import { getCircleInfo, getKeyMembers } from "@/lib/circle";

export const metadata = { title: "サークル紹介の管理" };

export default async function AdminAboutPage() {
  const [info, members] = await Promise.all([getCircleInfo(), getKeyMembers()]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">サークル紹介の管理</h1>
      <p className="mt-2 text-ink-muted">公開ページ「サークル紹介」の内容を編集します。</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">活動内容・活動頻度</h2>
        <div className="mt-4">
          <CircleInfoForm
            initial={{ about: info?.about ?? "", frequency: info?.frequency ?? "" }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">主要メンバー（{members.length}）</h2>
        <div className="mt-4 space-y-3">
          {members.map((m) => (
            <KeyMemberRow
              key={m.id}
              member={{ id: m.id, name: m.name, role: m.role, bio: m.bio, orderIndex: m.orderIndex }}
            />
          ))}
          {members.length === 0 && (
            <p className="text-sm text-ink-muted">主要メンバーがいません。下から追加してください。</p>
          )}
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h3 className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
            メンバーを追加
          </h3>
          <div className="mt-3">
            <AddKeyMemberForm />
          </div>
        </div>
      </section>
    </main>
  );
}
