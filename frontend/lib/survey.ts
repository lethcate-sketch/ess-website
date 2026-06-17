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
