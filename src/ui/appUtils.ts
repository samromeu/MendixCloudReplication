/**
 * Shared utilities for the App component
 */

import { DEFAULT_BASE_URL, DEFAULT_PATH_PREFIX, CREDENTIALS_STORAGE_KEY } from "./constants";

export interface Credentials {
  pat: string;
  apiUsername: string;
  apiKey: string;
}

/**
 * Load credentials from localStorage with fallback defaults.
 */
export function loadCredentials(): Credentials {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        pat: parsed.pat ?? "",
        apiUsername: parsed.apiUsername ?? "",
        apiKey: parsed.apiKey ?? "",
      };
    }
  } catch (e) {
    console.error("Failed to load credentials from localStorage", e);
  }
  return {
    pat: "",
    apiUsername: "",
    apiKey: "",
  };
}

/**
 * Save credentials to localStorage.
 */
export function saveCredentials(creds: Credentials): void {
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));
}

/**
 * Format ISO date string to localized format.
 */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Trim a string and return it or undefined if empty.
 */
export function trimOrUndefined(str: string): string | undefined {
  const trimmed = str.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Create API key auth object if both username and key are provided.
 * Returns null if either is missing.
 */
export function createApiKeyAuth(
  username: string,
  apiKey: string
): { username: string; apiKey: string } | null {
  const trimmedUsername = username.trim();
  const trimmedKey = apiKey.trim();
  if (trimmedUsername && trimmedKey) {
    return { username: trimmedUsername, apiKey: trimmedKey };
  }
  return null;
}
