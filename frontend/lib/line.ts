/**
 * LINE Messaging API 連携の共通設定と署名検証（サーバ専用 / LINE移行 M2）。
 *
 * 方針（[[line-migration-plan]]）:
 *  - メンバーの出欠・アンケートは LINE(リッチメニュー+LIFF+Webhook)で受ける。
 *  - Webhook は Next.js Route Handler(Vercel)に置き、x-line-signature を必ず検証する。
 *  - 機密値（チャネルシークレット/アクセストークン）は .env にのみ置き、ブラウザJSに晒さない。
 */
import crypto from "node:crypto";

/** Messaging API チャネルのシークレット（署名検証に使用）。未設定なら "" */
export const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? "";
/** Messaging API チャネルの長期アクセストークン（reply/push 送信に使用。M2 では未使用）。 */
export const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";

/** LINE が送ってくる webhook イベント（必要分のみの軽量型）。 */
export type LineWebhookEvent = {
  type: string; // message | postback | follow | unfollow | ...
  timestamp?: number;
  source?: { type?: string; userId?: string; groupId?: string; roomId?: string };
  replyToken?: string; // reply（無料）に必要。一度きり・短時間有効。
  message?: { type: string; text?: string; id?: string };
  postback?: { data: string };
};

/** webhook リクエストボディ（destination + events 配列）。 */
export type LineWebhookBody = {
  destination?: string;
  events?: LineWebhookEvent[];
};

/**
 * LINE Webhook の署名検証。
 *
 * 署名は Base64(HMAC-SHA256(channelSecret, rawBody))。必ず「未加工の生ボディ文字列」で
 * 計算すること（JSON.parse 後の再シリアライズは改変扱いになり検証に失敗する）。
 * タイミング攻撃を避けるため timingSafeEqual で比較する。
 *
 * @param rawBody  req.text() で取得した未加工のリクエストボディ
 * @param signature x-line-signature ヘッダの値
 * @returns 署名が一致すれば true
 */
export function verifyLineSignature(
  rawBody: string,
  signature: string | null | undefined,
): boolean {
  if (!LINE_CHANNEL_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", LINE_CHANNEL_SECRET)
    .update(rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // 長さが違うと timingSafeEqual が例外を投げるため先に弾く。
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const LINE_API = "https://api.line.me";

/**
 * reply（応答）メッセージでテキストを返す。reply はメッセージ通数を消費しない（無料）。
 * replyToken は webhook イベントごとに一度きり・短時間のみ有効。
 * アクセストークン未設定や送信失敗時は握りつぶす（webhook 自体は 200 を返したいため）。
 */
export async function replyMessage(
  replyToken: string,
  text: string,
): Promise<void> {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !replyToken) return;
  try {
    const res = await fetch(`${LINE_API}/v2/bot/message/reply`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
    });
    if (!res.ok) {
      console.warn(`[line] reply failed: ${res.status} ${await res.text()}`);
    }
  } catch (e) {
    console.warn("[line] reply error:", e);
  }
}

/**
 * userId のプロフィール（表示名・アイコン）を取得する。新規メンバー作成時の初期名に使う。
 * 友だちでない/失敗時は null。
 */
export async function getLineProfile(
  userId: string,
): Promise<{ displayName?: string; pictureUrl?: string } | null> {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !userId) return null;
  try {
    const res = await fetch(`${LINE_API}/v2/bot/profile/${userId}`, {
      headers: { authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as { displayName?: string; pictureUrl?: string };
  } catch {
    return null;
  }
}
