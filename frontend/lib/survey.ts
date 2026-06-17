/** アンケート結果の読み取り（SSR / §3-5: admin ページは Prisma 直読み）。書き込みは Flask 経由。 */
import { prisma } from "./prisma";

/**
 * イベントのアンケート結果に必要な生データをまとめて取得する。
 * - questions: 設問（options は JSON 文字列）
 * - responses: 全回答（回答者 user を含む。answerChoice は JSON 文字列の可能性）
 * - attendances: 出欠（status・comment＝遅刻理由。user を含む）
 * 整形（回答者単位へのグルーピング）は呼び出し側（ページ）で行う。
 */
export async function getEventSurveyResults(eventId: string) {
  const [event, questions, attendances] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.eventSurveyQuestion.findMany({
      where: { eventId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.attendance.findMany({ where: { eventId }, include: { user: true } }),
  ]);

  const qIds = questions.map((q) => q.id);
  const responses = qIds.length
    ? await prisma.eventSurveyResponse.findMany({
        where: { questionId: { in: qIds } },
        include: { user: true },
      })
    : [];

  return { event, questions, attendances, responses };
}

/** メンバーの回答用: イベントの設問一覧（orderIndex 昇順）。 */
export async function getEventQuestions(eventId: string) {
  return prisma.eventSurveyQuestion.findMany({
    where: { eventId },
    orderBy: { orderIndex: "asc" },
  });
}

/** 自分の既存回答（questionId -> { answerText, answerChoice(JSON文字列) }）。プリフィル用。 */
export async function getUserSurveyAnswers(userId: string, eventId: string) {
  type Ans = { answerText: string | null; answerChoice: string | null };
  const qs = await prisma.eventSurveyQuestion.findMany({
    where: { eventId },
    select: { id: true },
  });
  const qIds = qs.map((q) => q.id);
  if (qIds.length === 0) return {} as Record<string, Ans>;
  const rows = await prisma.eventSurveyResponse.findMany({
    where: { userId, questionId: { in: qIds } },
  });
  return Object.fromEntries(
    rows.map((r) => [r.questionId, { answerText: r.answerText, answerChoice: r.answerChoice }]),
  ) as Record<string, Ans>;
}
