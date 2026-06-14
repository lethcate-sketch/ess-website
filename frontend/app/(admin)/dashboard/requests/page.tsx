import { StatusControl } from "@/components/admin/StatusControl";
import { DateTime } from "@/components/ui/DateTime";
import { getAllContacts, getAllParticipationRequests } from "@/lib/admin";

export const metadata = { title: "申込・問い合わせ" };

const PR_STATUS = [
  { value: "NEW", label: "未対応" },
  { value: "CONTACTED", label: "連絡済" },
  { value: "DONE", label: "完了" },
];
const CT_STATUS = [
  { value: "NEW", label: "未対応" },
  { value: "REPLIED", label: "返信済" },
  { value: "CLOSED", label: "完了" },
];
const PR_TYPE: Record<string, string> = { TRIAL: "見学", JOIN: "入会" };

export default async function RequestsPage() {
  const [requests, contacts] = await Promise.all([
    getAllParticipationRequests(),
    getAllContacts(),
  ]);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">申込・問い合わせ</h1>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">見学・参加申し込み（{requests.length}）</h2>
        <div className="mt-4 overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-muted text-left font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-4 py-3">受付</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">メール</th>
                <th className="px-4 py-3">メッセージ</th>
                <th className="px-4 py-3">対応</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <DateTime value={r.createdAt.toISOString()} dateOnly className="font-mono text-xs text-ink-muted" />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{PR_TYPE[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{r.email}</td>
                  <td className="max-w-xs px-4 py-3 text-ink-muted">{r.message ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusControl endpoint="participation-requests" id={r.id} current={r.status} options={PR_STATUS} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && <p className="px-4 py-6 text-sm text-ink-muted">申し込みはありません。</p>}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">お問い合わせ（{contacts.length}）</h2>
        <div className="mt-4 overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-muted text-left font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              <tr>
                <th className="px-4 py-3">受付</th>
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">件名</th>
                <th className="px-4 py-3">内容</th>
                <th className="px-4 py-3">対応</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contacts.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-4 py-3">
                    <DateTime value={c.createdAt.toISOString()} dateOnly className="font-mono text-xs text-ink-muted" />
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.subject}</td>
                  <td className="max-w-xs px-4 py-3 text-ink-muted">{c.message}</td>
                  <td className="px-4 py-3">
                    <StatusControl endpoint="contact" id={c.id} current={c.status} options={CT_STATUS} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && <p className="px-4 py-6 text-sm text-ink-muted">問い合わせはありません。</p>}
        </div>
      </section>
    </main>
  );
}
