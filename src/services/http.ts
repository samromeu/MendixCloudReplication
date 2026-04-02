/**
 * General network helpers used across the API client.
 */

/**
 * Abortable fetch with optional timeout (default 10 s).
 * Helps prevent UI buttons from hanging forever when a request never completes.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Validate a fetch() response, throwing a nicely formatted error if not ok.
 */
export async function checkResponse(response: Response, url?: string): Promise<void> {
  if (!response.ok) {
    const body = await response.text();
    let message = `API error ${response.status}: ${response.statusText}`;
    if (url) message += ` - ${url}`;
    try {
      const json = JSON.parse(body);
      if (json.error_code) message += ` - ${json.error_code}`;
      if (json.message) message += ` - ${json.message}`;
    } catch {
      if (body) message += ` - ${body.slice(0, 200)}`;
    }
    throw new Error(message);
  }
}

export function wrapNetworkError(e: unknown, context?: string): Error {
  if (e instanceof TypeError && e.message === "Failed to fetch") {
    const ctx = context ? ` (${context})` : "";
    return new Error(
      `Network request failed${ctx}. This may be CORS or the Backups API blocking Studio Pro's webview. If environments load but snapshots don't, the Backups API v2 may use different CORS rules. Try creating a snapshot in the Mendix Portal first, or use the Portal to download backups.`
    );
  }
  if (e instanceof DOMException && e.name === "AbortError") {
    const ctx = context ? ` (${context})` : "";
    return new Error(`Request timed out${ctx}. The server may be slow, unreachable, or blocking the request.`);
  }
  return e instanceof Error ? e : new Error(String(e));
}

/**
 * Build API base path: default /api, or e.g. /deploy/api for some deployments
 */
export function apiPath(baseUrl: string, pathPrefix?: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const prefix = (pathPrefix ?? "api").replace(/^\//g, "").replace(/\/$/, "") || "api";
  return `${base}/${prefix}`;
}
