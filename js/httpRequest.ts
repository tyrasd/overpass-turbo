// thin wrappers around the fetch API
//
// `fetch` only rejects on network-level failures, so these helpers turn a
// non-2xx response into a rejected promise as well (like jQuery.ajax did).

export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;

  constructor(response: Response, body: string) {
    super(`HTTP ${response.status} ${response.statusText || ""}`.trim());
    this.name = "HttpError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.body = body;
  }
}

/** like `fetch`, but rejects with an {@link HttpError} on a non-2xx response */
export async function request(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok)
    throw new HttpError(response, await response.text().catch(() => ""));
  return response;
}

export async function requestText(
  url: string | URL,
  init?: RequestInit
): Promise<string> {
  return (await request(url, init)).text();
}

export async function requestJson<T = any>(
  url: string | URL,
  init?: RequestInit
): Promise<T> {
  return (await request(url, init)).json() as Promise<T>;
}

/** true if the rejection was caused by aborting the request */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
