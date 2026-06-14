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

export const FLASK_API_BASE_URL = FLASK;
