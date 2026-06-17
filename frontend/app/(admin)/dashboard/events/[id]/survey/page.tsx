import Link from "next/link";
import { notFound } from "next/navigation";

import {
  SurveyResults,
  type SurveyRespondent,
} from "@/components/admin/SurveyResults";
import { SurveyQuestionManager } from "@/components/admin/SurveyQuestionManager";
import { getEventSurveyResults } from "@/lib/survey";

export const metadata = { title: "アンケート結果" };

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// answerChoice は単一値/配列/JSON のいずれもありうるため string[] に正規化する。
function normalizeChoice(raw: string | null): string[] {
  if (raw == null || raw === "") return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String);
    if (v == null) return [];
    return [String(v)];
  } catch {
    return [raw];
  }
}

export default async function SurveyResultPage({ params }: { params: { id: string } }) {
  const data = await getEventSurveyResults(params.id);
  if (!data.event) notFound();

  const questions = data.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    inputType: q.inputType,
    options: parseOptions(q.options),
    required: q.required,
  }));

  // 出欠（userId -> attendance）
  const attByUser = new Map(data.attendances.map((a) => [a.userId, a]));

  // 回答を回答者単位にまとめる
  const byUser = new Map<string, SurveyRespondent>();
  for (const r of data.responses) {
    let u = byUser.get(r.userId);
    if (!u) {
      const att = attByUser.get(r.userId);
      u = {
        userId: r.userId,
        name: r.user?.name ?? "—",
        attendanceStatus: att?.status ?? null,
        lateReason: att?.comment ?? null,
        answers: {},
      };
      byUser.set(r.userId, u);
    }
    u.answers[r.questionId] = {
      text: r.answerText,
      choice: normalizeChoice(r.answerChoice),
    };
  }
  const respondents = [...byUser.values()];

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <Link
        href={`/dashboard/events/${data.event.id}`}
        className="font-mono text-xs text-ink-muted hover:text-accent"
      >
        ← イベント編集
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">アンケート</h1>
      <p className="mt-2 text-ink-muted">{data.event.title}</p>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-navy">設問の管理</h2>
        <p className="mt-1 text-sm text-ink-muted">
          アンケートの設問を作成・削除します。メンバーはイベント詳細ページから回答できます。
        </p>
        <div className="mt-4">
          <SurveyQuestionManager eventId={data.event.id} questions={questions} />
        </div>
      </section>

      <div className="mt-12 border-t border-line pt-8">
        {questions.length === 0 ? (
          <p className="text-sm text-ink-muted">
            設問を追加すると、ここに回答の集計が表示されます。
          </p>
        ) : (
          <SurveyResults questions={questions} respondents={respondents} />
        )}
      </div>
    </main>
  );
}
