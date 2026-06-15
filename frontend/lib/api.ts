/**
 * Flask 呼び出しラッパー（サーバ専用 / §4 lib/api.ts）。
 * 書き込み・業務ロジックは必ず Flask API 経由（§3-5）。アクセストークンは
 * BFF が httpOnly Cookie から取り出し Authorization ヘッダで中継する（§3-4）。
 */
const FLASK = process.env.FLASK_API_BASE_URL ?? "http://localhost:5000";

type FlaskInit = Omit<RequestInit, "headers"> & {
  accessToken?: string;
  headers?: Record<string, string>;
};

export async function flaskFetch(
  path: string,
  init: FlaskInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init.headers ?? {}),
  };
  if (init.accessToken) headers["authorization"] = `Bearer ${init.accessToken}`;
  return fetch(`${FLASK}${path}`, { ...init, headers, cache: "no-store" });
}

/**
 * Render 無料プランの Flask(ess-api) は無アクセス時にスリープし、起床まで 502/503 を返す。
 * 起床待ちのため、502/503・接続失敗のときに一定回数リトライして自動で成功させる。
 * 502/503 は Render のロードバランサが返すもので、アプリにリクエストは届いていないため、
 * 書き込み(POST 等)でも安全に再試行できる。
 * @param doFetch 1 回分の fetch を行う関数
 */
export async function withWakeRetry(
  doFetch: () => Promise<Response>,
  { retries = 6, delayMs = 8000 }: { retries?: number; delayMs?: number } = {},
): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await doFetch();
      if (res.status !== 502 && res.status !== 503) return res;
      last = res;
    } catch {
      last = null; // 接続拒否（起床中）など
    }
    if (attempt >= retries) break;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return (
    last ??
    new Response(
      JSON.stringify({
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "サーバーに接続できませんでした。少し待って再度お試しください。",
        },
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    )
  );
}

/** flaskFetch を Flask 起床待ちリトライ付きで呼ぶ（認証など、ユーザー起点の重要操作用）。 */
export function flaskFetchAwake(
  path: string,
  init: FlaskInit = {},
  opts?: { retries?: number; delayMs?: number },
): Promise<Response> {
  return withWakeRetry(() => flaskFetch(path, init), opts);
}

export const FLASK_API_BASE_URL = FLASK;
