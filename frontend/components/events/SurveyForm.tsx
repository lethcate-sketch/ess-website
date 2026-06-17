"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

export type AnswerQuestion = {
  id: string;
  questionText: string;
  inputType: string; // TEXT | SINGLE | MULTI | SCALE
  options: string[];
  required: boolean;
};
type InitialAnswer = { answerText: string | null; answerChoice: string | null };

type State = { text: string; single: string; multi: string[] };

function parseChoice(raw: string | null): string | string[] | null {
  if (raw == null || raw === "") return null;
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String);
    return v == null ? null : String(v);
  } catch {
    return raw;
  }
}

function initState(
  questions: AnswerQuestion[],
  initial: Record<string, InitialAnswer>,
): Record<string, State> {
  const out: Record<string, State> = {};
  for (const q of questions) {
    const a = initial[q.id];
    const choice = parseChoice(a?.answerChoice ?? null);
    out[q.id] = {
      text: a?.answerText ?? "",
      single: typeof choice === "string" ? choice : Array.isArray(choice) ? (choice[0] ?? "") : "",
      multi: Array.isArray(choice) ? choice : choice ? [String(choice)] : [],
    };
  }
  return out;
}

/** メンバー: アンケート回答フォーム（既存回答をプリフィルし、まとめて送信）。 */
export function SurveyForm({
  eventId,
  questions,
  initialAnswers,
}: {
  eventId: string;
  questions: AnswerQuestion[];
  initialAnswers: Record<string, InitialAnswer>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, State>>(() =>
    initState(questions, initialAnswers),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const patch = (qid: string, p: Partial<State>) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...p } }));
    setSaved(false);
  };
  const toggleMulti = (qid: string, opt: string) => {
    setAnswers((prev) => {
      const cur = prev[qid].multi;
      const next = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt];
      return { ...prev, [qid]: { ...prev[qid], multi: next } };
    });
    setSaved(false);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const responses: {
      questionId: string;
      answerText: string | null;
      answerChoice: string | string[] | null;
    }[] = [];
    for (const q of questions) {
      const a = answers[q.id];
      let answered = false;
      if (q.inputType === "TEXT") {
        if (a.text.trim()) {
          responses.push({ questionId: q.id, answerText: a.text.trim(), answerChoice: null });
          answered = true;
        }
      } else if (q.inputType === "MULTI") {
        if (a.multi.length) {
          responses.push({ questionId: q.id, answerText: null, answerChoice: a.multi });
          answered = true;
        }
      } else if (a.single) {
        responses.push({ questionId: q.id, answerText: null, answerChoice: a.single });
        answered = true;
      }
      if (q.required && !answered) {
        setError(`「${q.questionText}」は必須です。`);
        return;
      }
    }
    if (responses.length === 0) {
      setError("回答を入力してください。");
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/proxy/events/${eventId}/survey/responses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "送信に失敗しました。");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError message={error} />
      {saved && (
        <p className="border border-accent bg-accent-subtle px-3 py-2 text-sm text-ink">
          回答を送信しました。
        </p>
      )}

      {questions.map((q, i) => {
        const a = answers[q.id];
        return (
          <div key={q.id}>
            <p className="text-sm font-medium text-ink">
              <span className="mr-2 font-mono text-xs text-ink-subtle">Q{i + 1}</span>
              {q.questionText}
              {q.required && <span className="ml-1 text-danger">*</span>}
            </p>
            <div className="mt-2">
              {q.inputType === "TEXT" && (
                <Textarea
                  rows={2}
                  value={a.text}
                  onChange={(e) => patch(q.id, { text: e.target.value })}
                />
              )}

              {q.inputType === "SINGLE" && (
                <div className="space-y-1.5">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={a.single === opt}
                        onChange={() => patch(q.id, { single: opt })}
                        className="h-4 w-4"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.inputType === "MULTI" && (
                <div className="space-y-1.5">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={a.multi.includes(opt)}
                        onChange={() => toggleMulti(q.id, opt)}
                        className="h-4 w-4"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.inputType === "SCALE" && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => patch(q.id, { single: opt })}
                      className={cn(
                        "border px-3 py-1.5 text-sm transition-colors",
                        a.single === opt
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-line text-ink-muted hover:border-ink",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <Button type="submit" disabled={loading}>
        {loading ? "送信中..." : "回答を送信"}
      </Button>
    </form>
  );
}
