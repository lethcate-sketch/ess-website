import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";

export type SurveyQuestion = {
  id: string;
  questionText: string;
  inputType: string; // TEXT | SINGLE | MULTI | SCALE
  options: string[];
};
export type SurveyRespondent = {
  userId: string;
  name: string;
  attendanceStatus: string | null; // ATTENDING | LATE | UNDECIDED | ABSENT | null(未登録)
  lateReason: string | null;
  answers: Record<string, { text: string | null; choice: string[] }>;
};

const STATUS_LABEL: Record<string, string> = { ...ATTENDANCE_STATUS_LABEL, NONE: "未登録" };
const statusKey = (r: SurveyRespondent) => r.attendanceStatus ?? "NONE";
const REASON_STATUSES = new Set(["LATE", "ABSENT"]);

/** アンケート結果: 設問ごとの集計＋回答者一覧（全回答者対象）。 */
export function SurveyResults({
  questions,
  respondents,
}: {
  questions: SurveyQuestion[];
  respondents: SurveyRespondent[];
}) {
  const isText = (q: SurveyQuestion) => q.inputType === "TEXT";

  return (
    <div className="space-y-10">
      {/* ===== 設問ごとの集計 ===== */}
      <section>
        <h2 className="font-display text-lg font-bold text-navy">
          集計結果（回答 {respondents.length} 名）
        </h2>
        {questions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">設問がありません。</p>
        ) : (
          <div className="mt-4 space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="border border-line p-4">
                <p className="font-medium text-ink">
                  <span className="mr-2 font-mono text-xs text-ink-subtle">Q{i + 1}</span>
                  {q.questionText}
                </p>
                <div className="mt-3">
                  {isText(q) ? (
                    <TextAnswers question={q} respondents={respondents} />
                  ) : (
                    <ChoiceTally question={q} respondents={respondents} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== 回答者一覧（各ユーザーの回答） ===== */}
      <section>
        <h2 className="font-display text-lg font-bold text-navy">回答者一覧</h2>
        {respondents.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">まだ回答がありません。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                    氏名
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                    出欠
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                    理由
                  </th>
                  {questions.map((q, i) => (
                    <th
                      key={q.id}
                      className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink-subtle"
                    >
                      Q{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {respondents.map((r) => (
                  <tr key={r.userId} className="border-b border-line/60 align-top">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{r.name}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="font-mono text-xs text-ink-muted">
                        {STATUS_LABEL[statusKey(r)]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {r.attendanceStatus && REASON_STATUSES.has(r.attendanceStatus)
                        ? r.lateReason || "—"
                        : "—"}
                    </td>
                    {questions.map((q) => (
                      <td key={q.id} className="px-3 py-2 text-ink">
                        {formatAnswer(r.answers[q.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatAnswer(a?: { text: string | null; choice: string[] }): string {
  if (!a) return "—";
  if (a.choice.length) return a.choice.join(", ");
  return a.text || "—";
}

function ChoiceTally({
  question,
  respondents,
}: {
  question: SurveyQuestion;
  respondents: SurveyRespondent[];
}) {
  const counts: Record<string, number> = {};
  let answered = 0;
  for (const r of respondents) {
    const choices = r.answers[question.id]?.choice ?? [];
    if (choices.length) answered += 1;
    for (const c of choices) counts[c] = (counts[c] ?? 0) + 1;
  }
  const keys = [
    ...question.options,
    ...Object.keys(counts).filter((k) => !question.options.includes(k)),
  ];
  const max = Math.max(1, ...Object.values(counts));
  if (keys.length === 0) {
    return <p className="text-sm text-ink-muted">回答: {answered} 件</p>;
  }
  return (
    <div className="space-y-1.5">
      {keys.map((k) => {
        const n = counts[k] ?? 0;
        return (
          <div key={k} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-ink">{k}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand-gradient"
                style={{ width: `${(n / max) * 100}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

function TextAnswers({
  question,
  respondents,
}: {
  question: SurveyQuestion;
  respondents: SurveyRespondent[];
}) {
  const texts = respondents
    .map((r) => ({ name: r.name, text: r.answers[question.id]?.text }))
    .filter((x): x is { name: string; text: string } => Boolean(x.text));
  if (texts.length === 0) {
    return <p className="text-sm text-ink-muted">回答なし</p>;
  }
  return (
    <ul className="space-y-2">
      {texts.map((x, i) => (
        <li key={i} className="border-l-2 border-line pl-3 text-sm text-ink">
          {x.text}
          <span className="ml-2 font-mono text-[11px] text-ink-subtle">— {x.name}</span>
        </li>
      ))}
    </ul>
  );
}
