/**
 * Mendix Deploy API v4 (PAT) and Backups API v2 client
 *
 * The various helper utilities (headers, HTTP wrappers and shared types) have
 * been extracted into small modules in `services/`. This keeps the endpoint
 * file focused on the actual network calls.
 */

import type {
  MendixApp,
  MendixEnvironment,
  MendixEnvironmentV1,
  Snapshot,
  Archive,
  ApiKeyAuth,
} from "./types";
import {
  fetchWithTimeout,
  checkResponse,
  wrapNetworkError,
  apiPath,
} from "./http";
import { patHeaders, apiKeyHeaders, backupsHeaders } from "./headers";

/**
 * Fetch environments using Deploy API v4 and Personal Access Token.
 * Works with your existing C# setup.
 */
export async function fetchEnvironmentsV4(
  baseUrl: string,
  pat: string,
  appId: string,
  pathPrefix?: string
): Promise<MendixEnvironment[]> {
  try {
    const basePath = apiPath(baseUrl, pathPrefix);
    const url = `${basePath}/v4/apps/${encodeURIComponent(appId)}/environments`;
    console.debug("fetchEnvironmentsV4", url);
    const response = await fetchWithTimeout(url, {
      headers: patHeaders(pat),
    });
    await checkResponse(response, url);
    const data = await response.json();
    const envs = data?.Environments ?? data?.environments ?? [];
    return Array.isArray(envs) ? envs : [];
  } catch (e) {
    throw wrapNetworkError(e, "fetch environments");
  }
}

/**
 * Fetch apps using Deploy API v4 and Personal Access Token.
 * Returns list of apps accessible to the user.
 */
export async function fetchApps(
  baseUrl: string,
  pat: string,
  pathPrefix?: string
): Promise<MendixApp[]> {
  try {
    const basePath = apiPath(baseUrl, pathPrefix);
    const url = `${basePath}/v4/apps`;
    console.debug("fetchApps", url);
    const response = await fetchWithTimeout(url, {
      headers: patHeaders(pat),
    });
    await checkResponse(response, url);
    const data = await response.json();
    console.debug("fetchApps response data:", data);
    
    // The API returns { apps: [...], pagination: {...} }
    const appList = data?.apps ?? [];
    
    if (!Array.isArray(appList)) {
      console.warn("fetchApps: apps is not array", appList);
      return [];
    }
    
    // Transform API response to MendixApp type
    // API returns: { id, name, subdomain, ... }
    // Type expects: { ProjectId, Name, AppId, Url }
    const transformed = appList.map((app: any) => ({
      ProjectId: app.id,
      Name: app.name,
      AppId: app.id,
      Url: app.subdomain ? `https://${app.subdomain}.mendixcloud.com` : "",
    }));
    
    console.debug("fetchApps: returning", transformed.length, "apps");
    return transformed;
  } catch (e) {
    throw wrapNetworkError(e, "fetch apps (Deploy API v4)");
  }
}

/**
 * Fetch environments using Deploy API v1 (API key).
 */
export async function fetchEnvironmentsV1(
  baseUrl: string,
  username: string,
  apiKey: string,
  appId: string
): Promise<MendixEnvironmentV1[]> {
  try {
    const base = baseUrl.replace(/\/$/, "");
    const url = `${base}/api/1/apps/${encodeURIComponent(appId)}/environments`;
    console.debug("fetchEnvironmentsV1", url);
    const response = await fetchWithTimeout(url, {
      headers: apiKeyHeaders(username, apiKey),
    });
    await checkResponse(response, url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw wrapNetworkError(e, "fetch environments (Deploy API v1)");
  }
}

/** Normalize v4 or v1 environment to a common shape for the UI */
export function envId(env: MendixEnvironment | MendixEnvironmentV1): string {
  return "id" in env ? env.id : (env as MendixEnvironmentV1).EnvironmentId;
}

export function envName(env: MendixEnvironment | MendixEnvironmentV1): string {
  return "name" in env ? env.name : (env as MendixEnvironmentV1).Mode;
}

export function envState(env: MendixEnvironment | MendixEnvironmentV1): string {
  return "state" in env ? env.state : (env as MendixEnvironmentV1).Status;
}

/**
 * List snapshots from the Backups API v2.
 *
 * Authentication is handled by `backupsHeaders()`, which **prefers the
 * API‑key credentials if they’re provided** and only falls back to the PAT when
 * `apiKeyAuth` is missing/empty. The PAT argument is now optional and placed
 * last so callers can omit it entirely when only using apiKeyAuth.
 */
/**
 * Backups API lives on deploy.mendix.com rather than cloud.home.mendix.com.
 * Accept either host and rewrite automatically for convenience.
 *
 * Note that rewriting the host does **not** bypass CORS – the API remains
 * blocked for browser/webview clients unless Mendix enables CORS headers.
 */
// helper used by any API that lives on the legacy deploy host
function normalizeDeployHost(baseUrl: string): string {
  const u = baseUrl.trim();
  if (!u) return u;
  try {
    const parsed = new URL(u);
    if (parsed.hostname === "cloud.home.mendix.com") {
      parsed.hostname = "deploy.mendix.com";
    }
    return parsed.toString().replace(/\/+$/g, "");
  } catch {
    return u.replace("cloud.home.mendix.com", "deploy.mendix.com");
  }
}

/**
 * List snapshots from the Backups API v2.
 *
 * Authentication is handled by `backupsHeaders()`, which prefers the API key
 * credentials when an `apiKeyAuth` object with non‑empty fields is supplied.
 * In that case the returned headers contain **only** the Mendix‑Username and
 * Mendix‑ApiKey pairs; no `Authorization` (PAT) header is included. If
 * `apiKeyAuth` is absent or incomplete the function will fall back to using the
 * provided PAT.
 *
 * The helper logs the final headers for debugging so you can verify which set
 * is being used at runtime.
 */
export async function fetchSnapshots(
  baseUrl: string,
  projectId: string,
  environmentId: string,
  limit = 20,
  pathPrefix?: string,
  apiKeyAuth?: ApiKeyAuth | null,
  getProxyUrl?: (url: string) => Promise<string>
): Promise<Snapshot[]> {
  if (!apiKeyAuth?.username?.trim() || !apiKeyAuth?.apiKey?.trim()) {
    throw new Error("Backups API v2 requires API key authentication; PAT is not supported for snapshots");
  }
  try {
    const snapshotsHost = normalizeDeployHost(baseUrl);
    const basePath = apiPath(snapshotsHost, pathPrefix);
    const directUrl = `${basePath}/v2/apps/${projectId}/environments/${environmentId}/snapshots?limit=${limit}&offset=0`;
    const url = getProxyUrl ? await getProxyUrl(directUrl) : directUrl;
    console.debug("fetchSnapshots", url);

    const headers = apiKeyHeaders(apiKeyAuth.username.trim(), apiKeyAuth.apiKey.trim());
    console.debug("fetchSnapshots headers", headers);

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers,
    });
    await checkResponse(response, url);
    const data = await response.json();
    const snapshots = data?.snapshots ?? [];
    return snapshots.filter((s: Snapshot) => s.state === "completed");
  } catch (e) {
    throw wrapNetworkError(e, "fetch snapshots - Backups API v2 may block this context or require different auth");
  }
}

export async function createDatabaseArchive(
  baseUrl: string,
  pat: string,
  projectId: string,
  environmentId: string,
  snapshotId: string,
  pathPrefix?: string,
  apiKeyAuth?: ApiKeyAuth | null,
  getProxyUrl?: (url: string) => Promise<string>
): Promise<Archive> {
  const deployHost = normalizeDeployHost(baseUrl);
  const basePath = apiPath(deployHost, pathPrefix);
  const directUrl = `${basePath}/v2/apps/${projectId}/environments/${environmentId}/snapshots/${snapshotId}/archives?data_type=database_only`;
  const url = getProxyUrl ? await getProxyUrl(directUrl) : directUrl;
  console.debug("createDatabaseArchive", url);
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: backupsHeaders(pat, apiKeyAuth),
  });
  await checkResponse(response, url);
  return response.json();
}

export async function getArchiveStatus(
  baseUrl: string,
  pat: string,
  projectId: string,
  environmentId: string,
  snapshotId: string,
  archiveId: string,
  pathPrefix?: string,
  apiKeyAuth?: ApiKeyAuth | null,
  getProxyUrl?: (url: string) => Promise<string>
): Promise<Archive> {
  const deployHost = normalizeDeployHost(baseUrl);
  const basePath = apiPath(deployHost, pathPrefix);
  const directUrl = `${basePath}/v2/apps/${projectId}/environments/${environmentId}/snapshots/${snapshotId}/archives/${archiveId}`;
  const url = getProxyUrl ? await getProxyUrl(directUrl) : directUrl;
  console.debug("getArchiveStatus", url);
  const response = await fetchWithTimeout(url, {
    headers: backupsHeaders(pat, apiKeyAuth),
  });
  await checkResponse(response, url);
  return response.json();
}

export async function pollArchiveUntilReady(
  baseUrl: string,
  pat: string,
  projectId: string,
  environmentId: string,
  snapshotId: string,
  archiveId: string,
  onProgress?: (state: string) => void,
  pathPrefix?: string,
  apiKeyAuth?: ApiKeyAuth | null,
  getProxyUrl?: (url: string) => Promise<string>
): Promise<string> {
  const maxAttempts = 150;
  const intervalMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const archive = await getArchiveStatus(
      baseUrl,
      pat,
      projectId,
      environmentId,
      snapshotId,
      archiveId,
      pathPrefix,
      apiKeyAuth,
      getProxyUrl
    );
    onProgress?.(archive.state);

    if (archive.state === "completed" && archive.url) {
      return archive.url;
    }
    if (archive.state === "failed") {
      throw new Error(
        archive.status_message ?? "Archive creation failed"
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Archive creation timed out");
}

// re-export the important types so callers only need to import from this module
export type {
  MendixApp,
  MendixEnvironment,
  MendixEnvironmentV1,
  Snapshot,
  Archive,
  ApiKeyAuth,
};
