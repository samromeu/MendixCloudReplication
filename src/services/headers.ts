import type { ApiKeyAuth } from "./types";

/**
 * Helpers for constructing authentication headers.
 */

export function patHeaders(pat: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `MxToken ${pat.trim()}`,
  };
}

export function apiKeyHeaders(username: string, apiKey: string): Record<string, string> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Mendix-Username": username,
    "Mendix-ApiKey": apiKey,
  };
  console.debug("apiKeyHeaders being sent:", {
    "Mendix-Username": username,
    "Mendix-ApiKey": apiKey ? `(${apiKey.length} chars)` : "(empty)",
  });
  return headers;
}

/**
 * Backups API v2 prefers API key auth; fall back to PAT when the key is missing.
 */
export function backupsHeaders(
  pat: string,
  apiKeyAuth?: ApiKeyAuth | null
): Record<string, string> {
  if (apiKeyAuth?.username?.trim() && apiKeyAuth?.apiKey?.trim()) {
    return apiKeyHeaders(apiKeyAuth.username.trim(), apiKeyAuth.apiKey.trim());
  }
  return patHeaders(pat);
}
