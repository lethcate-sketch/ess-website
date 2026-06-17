"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

export type ManagedQuestion = {
  id: string;
  questionText: string;
  inputType: string;
  options: string[];
  required: boolean;
};

export const SURVEY_TYPE_LABEL: Record<string, string> = {
  TEXT: "自由記述",
  SINGLE: "単一選択",
  MULTI: "複数選択",
  SCALE: "段階評価",
};

const SELECT_CLASS =
  "w-full border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

/** 管理: イベントのアンケート設問の作成・一覧・削除。 */
export function SurveyQuestionManager({
  eventId,
  questions,
}: {
  eventId: string;
  questions: ManagedQuestion[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [type, setType] = useState("TEXT");
  const [optionsText, setOptionsText] = useState("");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsOptions = type !== "TEXT";

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    const options = needsOptions
      ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : null;
    if (needsOptions && (!options || options.length < 1)) {
      setError("選択肢を1つ以上入力してください（1行に1つ）。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/events/${eventId}/survey/questions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionText: text,
          inputType: type,
          options,
          required,
          orderIndex: questions.length,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "追加に失敗しました。");
        return;
      }
      setText("");
      setOptionsText("");
      setRequired(false);
      setType("TEXT");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function remove(q: ManagedQuestion) {
    if (!window.confirm(`設問「${q.questionText}」と、その回答を削除します。よろしいですか？`)) {
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/proxy/events/${eventId}/survey/questions/${q.id}`, {
        method: "DELETE",
      });
    } catch {
      /* noop */
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {questions.length > 0 && (
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-3 border border-line p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  <span className="mr-2 font-mono text-xs text-ink-subtle">Q{i + 1}</span>
                  {q.questionText}
                  {q.required && <span className="ml-2 text-xs text-danger">必須</span>}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-subtle">
                  {SURVEY_TYPE_LABEL[q.inputType] ?? q.inputType}
                  {q.options.length ? ` ・ ${q.options.join(" / ")}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => remove(q)}
                className="shrink-0 border border-danger px-2.5 py-1.5 text-xs text-danger transition-colors hover:bg-danger-subtle disabled:opacity-50"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addQuestion} className="space-y-3 border-t border-line pt-4">
        <FormError message={error} />
        <div>
          <Label htmlFor="q-text">設問文</Label>
          <Input id="q-text" required value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="q-type">回答形式</Label>
            <select
              id="q-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="TEXT">自由記述</option>
              <option value="SINGLE">単一選択</option>
              <option value="MULTI">複数選択</option>
              <option value="SCALE">段階評価</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4"
            />
            必須にする
          </label>
        </div>
        {needsOptions && (
          <div>
            <Label htmlFor="q-options">選択肢（1行に1つ）</Label>
            <Textarea
              id="q-options"
              rows={3}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={type === "SCALE" ? "例:\n1\n2\n3\n4\n5" : "例:\nはい\nいいえ"}
            />
          </div>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "追加中..." : "設問を追加"}
        </Button>
      </form>
    </div>
  );
}
