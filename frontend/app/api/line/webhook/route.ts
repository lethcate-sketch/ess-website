import { NextResponse, type NextRequest } from "next/server";

import {
  LINE_CHANNEL_SECRET,
  getLineProfile,
  replyMessage,
  verifyLineSignature,
  type LineWebhookBody,
  type LineWebhookEvent,
} from "@/lib/line";
import { messageForResult, redeemLinkToken } from "@/lib/lineLink";

// Node の crypto / Prisma を使うため Node ランタイムで動かす（Edge にしない）。
export const runtime = "nodejs";
// 受信ごとに必ず実行（キャッシュ無効）。
export const dynamic = "force-dynamic";

// 友だち追加時・未連携ユーザーへの案内文。
const GREETING =
  "ようこそ！ESSのLINEへ🌿\n" +
  "出欠やアンケートをLINEで使うには、最初に連携が必要です。\n" +
  "配布された「招待コード」をこのトークにそのまま送ってください。";

const ASK_TEXT_CODE =
  "招待コードを《テキスト》で送ってください。（例: ESS-7K2M）";

/**
 * GET /api/line/webhook — デプロイ確認用の簡易ヘルスチェック（ブラウザで開ける）。
 * LINE 本体は POST しか使わない。
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "line-webhook",
    configured: Boolean(LINE_CHANNEL_SECRET),
  });
}

/**
 * 1 件の webhook イベントを処理する（M3: 友だち紐付け）。
 *  - follow（友だち追加）: 連携案内を返信。
 *  - message(text): 招待コードとして照合し User.lineUserId を紐付け、結果を返信。
 *    既に連携済みなら redeemLinkToken が 'already' を返す。
 * reply は無料。重い処理は将来 非同期化する（今は件数が少なく逐次で十分）。
 */
async function handleEvent(ev: LineWebhookEvent): Promise<void> {
  const lineUserId = ev.source?.userId;
  const replyToken = ev.replyToken;

  if (ev.type === "follow") {
    if (replyToken) await replyMessage(replyToken, GREETING);
    return;
  }

  if (ev.type === "message") {
    if (!lineUserId || !replyToken) return;
    if (ev.message?.type !== "text" || !ev.message.text) {
      await replyMessage(replyToken, ASK_TEXT_CODE);
      return;
    }
    // 表示名は新規作成時の初期名に使う（取得失敗時は未設定名でフォールバック）。
    const profile = await getLineProfile(lineUserId);
    const result = await redeemLinkToken({
      code: ev.message.text,
      lineUserId,
      displayName: profile?.displayName,
    });
    console.log(
      `[line/webhook] redeem userId=${lineUserId} -> ${result.status}`,
    );
    await replyMessage(replyToken, messageForResult(result));
    return;
  }

  // unfollow など、その他のイベントは現状ログのみ。
  console.log(`[line/webhook] unhandled event type=${ev.type}`);
}

/**
 * POST /api/line/webhook — LINE Messaging API の Webhook 受信口。
 *  1. 生ボディを取得し x-line-signature を HMAC-SHA256 で検証（なりすまし防止）。
 *  2. 各イベントを処理（M3: 紐付け）。
 *  3. 2xx を返す（LINE は 2xx の即時応答を期待。返さないと再送される）。
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  // 設定漏れをセットアップ時に気づけるよう早期に検知する。
  if (!LINE_CHANNEL_SECRET) {
    console.error("[line/webhook] LINE_CHANNEL_SECRET が未設定です（.env を確認）。");
    return NextResponse.json(
      {
        error: {
          code: "LINE_NOT_CONFIGURED",
          message: "LINE channel secret is not configured.",
        },
      },
      { status: 500 },
    );
  }

  // 署名不一致＝LINE 以外からの偽リクエスト。401 で拒否する。
  if (!verifyLineSignature(rawBody, signature)) {
    console.warn("[line/webhook] 署名検証に失敗しました。");
    return NextResponse.json(
      {
        error: {
          code: "INVALID_SIGNATURE",
          message: "Signature validation failed.",
        },
      },
      { status: 401 },
    );
  }

  // 署名OK。検証後なので安全にパースする。
  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    // 署名は通ったが本文が壊れている稀ケース。再送ループを避けるため 200 で受け流す。
    console.warn("[line/webhook] JSON parse に失敗しました（空ボディ等）。");
    return NextResponse.json({ ok: true });
  }

  const events = body.events ?? [];
  // 疎通確認: コンソールの「検証」は events=[] で届く。
  console.log(`[line/webhook] received ${events.length} event(s).`);
  for (const ev of events) {
    try {
      await handleEvent(ev);
    } catch (e) {
      // 1 イベントの失敗で全体を 5xx にしない（再送ループ回避）。
      console.error("[line/webhook] handleEvent error:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
