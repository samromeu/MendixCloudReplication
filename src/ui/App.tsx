import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { IHttpProxyApi } from "@mendix/extensions-api";
import {
  fetchEnvironmentsV4,
  fetchSnapshots,
  fetchApps,
  createDatabaseArchive,
  pollArchiveUntilReady,
  envId,
  envName,
  envState,
  type MendixEnvironment,
  type MendixApp,
  type Snapshot,
} from "../services/mendixApi";
import { styles } from "./styles";
import { AppInfoDisplay } from "./AppInfoDisplay";
import { EnvironmentInfoDisplay } from "./EnvironmentInfoDisplay";
import {
  loadCredentials,
  saveCredentials,
  formatDate,
  trimOrUndefined,
  createApiKeyAuth,
  type Credentials,
} from "./appUtils";
import {
  LOADING_APPS,
  LOADING_ENVIRONMENTS,
  LOADING_SNAPSHOTS,
  LOADING_CREATING_ARCHIVE,
  LOADING_DOWNLOADING,
  DEFAULT_BASE_URL,
  DEFAULT_PATH_PREFIX,
  TEXT_ENTER_CREDENTIALS,
  TEXT_PICK_ENVIRONMENT,
  TEXT_CLICK_TO_LOAD,
  TEXT_NO_SNAPSHOTS,
  TEXT_PICK_APP,
  ERROR_FAILED_APPS,
  ERROR_FAILED_ENVIRONMENTS,
  ERROR_FAILED_SNAPSHOTS,
  ERROR_FAILED_DOWNLOAD,
} from "./constants";

interface AppProps {
  projectId: string | null;
  httpProxy?: IHttpProxyApi;
}

interface UIState {
  loading: string | null;
  error: string | null;
  archiveProgress: string | null;
}

export function App({ projectId, httpProxy }: AppProps) {
  // Credentials
  const [credentials, setCredentials] = useState<Credentials>(loadCredentials);
  const [pat, setPat] = useState(credentials.pat);
  const [apiUsername, setApiUsername] = useState(credentials.apiUsername);
  const [apiKey, setApiKey] = useState(credentials.apiKey);
  const [saved, setSaved] = useState(false);

  // Data
  const [appId, setAppId] = useState("");
  const [apps, setApps] = useState<MendixApp[]>([]);
  const [environments, setEnvironments] = useState<MendixEnvironment[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<MendixEnvironment | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  // UI state
  const [ui, setUi] = useState<UIState>({
    loading: null,
    error: null,
    archiveProgress: null,
  });

  // Computed values
  const effectiveAppId = appId.trim();
  const effectiveBaseUrl = DEFAULT_BASE_URL;
  const hasCredentials = Boolean(pat.trim());
  const canFetch = hasCredentials && Boolean(effectiveAppId);
  const apiKeyAuth = useMemo(
    () => createApiKeyAuth(apiUsername, apiKey),
    [apiUsername, apiKey]
  );


  const saveCreds = useCallback(() => {
    const c = {
      pat: pat.trim(),
      apiUsername: apiUsername.trim(),
      apiKey: apiKey.trim(),
    };
    saveCredentials(c);
    setCredentials(c);
    setApiUsername(c.apiUsername);
    setApiKey(c.apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [pat, apiUsername, apiKey]);

  const loadApps = useCallback(async () => {
    if (!pat.trim()) return;

    console.debug("loadApps start", { effectiveBaseUrl });
    setUi((prev) => ({ ...prev, loading: LOADING_APPS, error: null }));

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.debug("loadApps timeout after 11s");
        setUi((prev) => ({
          ...prev,
          error: "Apps list request timed out after 10 seconds. Deploy API v4 may be unavailable.",
          loading: null,
        }));
      }
    }, 11000);

    try {
      const list = await fetchApps(
        effectiveBaseUrl,
        pat.trim(),
        trimOrUndefined(DEFAULT_PATH_PREFIX)
      );
      if (!cancelled) {
        setApps(list);
        setAppId((prev) => (prev ? prev : list[0]?.ProjectId ?? ""));
      }
    } catch (e) {
      if (!cancelled) {
        console.debug("loadApps error", e);
        setUi((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : ERROR_FAILED_APPS,
        }));
        setApps([]);
      }
    } finally {
      if (!cancelled) {
        console.debug("loadApps finished");
        clearTimeout(timeout);
        setUi((prev) => ({ ...prev, loading: null }));
      }
    }
  }, [pat, effectiveBaseUrl]);

  const loadEnvironments = useCallback(async () => {
    if (!canFetch) return;
    console.debug("loadEnvironments start", {
      effectiveBaseUrl,
      appId: effectiveAppId,
    });
    setUi((prev) => ({
      ...prev,
      loading: LOADING_ENVIRONMENTS,
      error: null,
    }));

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.debug("loadEnvironments timeout after 11s");
        setUi((prev) => ({
          ...prev,
          error: "Environments request timed out after 10 seconds. Deploy API v4 may be unavailable or your credentials may be invalid.",
          loading: null,
        }));
      }
    }, 11000);

    try {
      const list = await fetchEnvironmentsV4(
        effectiveBaseUrl,
        pat.trim(),
        effectiveAppId,
        trimOrUndefined(DEFAULT_PATH_PREFIX)
      );
      if (!cancelled) {
        setEnvironments(list);
        setSelectedEnv(list[0] ?? null);
        setSnapshots([]);
        setSelectedSnapshot(null);
      }
    } catch (e) {
      if (!cancelled) {
        console.debug("loadEnvironments error", e);
        setUi((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : ERROR_FAILED_ENVIRONMENTS,
        }));
        setEnvironments([]);
        setSelectedEnv(null);
      }
    } finally {
      if (!cancelled) {
        console.debug("loadEnvironments finished");
        clearTimeout(timeout);
        setUi((prev) => ({ ...prev, loading: null }));
      }
    }
  }, [pat, effectiveBaseUrl, effectiveAppId, canFetch]);

  const loadSnapshots = useCallback(async () => {
    if (!selectedEnv || !canFetch) return;

    setUi((prev) => ({ ...prev, loading: LOADING_SNAPSHOTS, error: null }));

    const timeout = setTimeout(() => {
      setUi((prev) => ({
        ...prev,
        error: "Snapshot request timed out after 10 seconds. The Backups API v2 may be blocked by CORS or unavailable from this context.",
        loading: null,
      }));
    }, 11000);

    try {
      // Use Studio Pro's HTTP proxy to bypass CORS restrictions
      const getProxyUrl = httpProxy ? (url: string) => httpProxy.getProxyUrl(url) : undefined;
      const list = await fetchSnapshots(
        effectiveBaseUrl,
        effectiveAppId,
        envId(selectedEnv),
        20,
        trimOrUndefined(DEFAULT_PATH_PREFIX),
        apiKeyAuth,
        getProxyUrl
      );
      clearTimeout(timeout);
      setSnapshots(list);
      setSelectedSnapshot(list[0] ?? null);
      setUi((prev) => ({ ...prev, loading: null }));
    } catch (e) {
      clearTimeout(timeout);
      setUi((prev) => ({
        ...prev,
        error: e instanceof Error ? e.message : ERROR_FAILED_SNAPSHOTS,
        loading: null,
      }));
      setSnapshots([]);
      setSelectedSnapshot(null);
    }
  }, [selectedEnv, pat, effectiveBaseUrl, effectiveAppId, canFetch, apiKeyAuth, httpProxy]);

  // Clear snapshots when the selected environment changes
  useEffect(() => {
    setSnapshots([]);
    setSelectedSnapshot(null);
  }, [selectedEnv]);

  const handleDownload = useCallback(async () => {
    if (!canFetch || !selectedEnv || !selectedSnapshot) return;

    setUi((prev) => ({
      ...prev,
      error: null,
      archiveProgress: LOADING_CREATING_ARCHIVE,
    }));

    try {
      const pf = trimOrUndefined(DEFAULT_PATH_PREFIX);
      const getProxyUrl = httpProxy ? (url: string) => httpProxy.getProxyUrl(url) : undefined;
      const archive = await createDatabaseArchive(
        effectiveBaseUrl,
        pat.trim(),
        effectiveAppId,
        envId(selectedEnv),
        selectedSnapshot.snapshot_id,
        pf,
        apiKeyAuth,
        getProxyUrl
      );

      const archiveUrl = await pollArchiveUntilReady(
        effectiveBaseUrl,
        pat.trim(),
        effectiveAppId,
        envId(selectedEnv),
        selectedSnapshot.snapshot_id,
        archive.archive_id,
        (state) => {
          setUi((prev) => ({
            ...prev,
            archiveProgress: `Archive: ${state}…`,
          }));
        },
        pf,
        apiKeyAuth,
        getProxyUrl
      );

      setUi((prev) => ({
        ...prev,
        archiveProgress: LOADING_DOWNLOADING,
      }));

      // Fetch the file through the proxy as a blob so the download triggers
      // a proper Save dialog in Studio Pro's webview (anchor href alone won't work)
      const downloadUrl = getProxyUrl ? await getProxyUrl(archiveUrl) : archiveUrl;
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) throw new Error(`Download failed: ${fileResponse.status} ${fileResponse.statusText}`);
      const blob = await fileResponse.blob();
      const blobUrl = URL.createObjectURL(blob);
      const filename = `backup-${envName(selectedEnv)}-${selectedSnapshot.snapshot_id.slice(0, 8)}.gz`;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setUi((prev) => ({ ...prev, archiveProgress: null }));
    } catch (e) {
      setUi((prev) => ({
        ...prev,
        error: e instanceof Error ? e.message : ERROR_FAILED_DOWNLOAD,
        archiveProgress: null,
      }));
    }
  }, [
    canFetch,
    pat,
    effectiveBaseUrl,
    effectiveAppId,
    selectedEnv,
    selectedSnapshot,
    apiKeyAuth,
    httpProxy,
  ]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Mendix Cloud Connector</h1>
      <p style={styles.subtitle}>
        Download database backups from deployed environments to restore locally
      </p>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Credentials</h2>
        <p style={styles.hint}>
          Use a{" "}
          <a
            href="https://user-settings.mendix.com/link/developersettings"
            target="_blank"
            rel="noopener noreferrer"
          >
            Personal Access Token
          </a>{" "}
          with <code>mx:deployment:read</code> (and <code>mx:deployment:write</code> for downloads). You need Access to Backups and API Rights on your environments.
        </p>
        <p style={styles.hint}>
          <strong>Note:</strong> Both environment and app data are fetched from <code>cloud.home.mendix.com</code>.
          Snapshots are stored on <code>deploy.mendix.com</code> and are blocked by CORS in browsers – they only work from a server-to-server client or via a proxy.
        </p>
        <div style={styles.row}>
          <label style={styles.label}>Personal Access Token</label>
          <input
            type="password"
            placeholder="Personal Access Token"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            style={{ ...styles.input, minWidth: 320 }}
          />
          <button onClick={saveCreds} style={styles.btn}>
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
        <div style={styles.row}>
          <label style={styles.label}>API username (email)</label>
          <input
            type="text"
            placeholder="Mendix username/email"
            value={apiUsername}
            onChange={(e) => setApiUsername(e.target.value)}
            style={{ ...styles.input, minWidth: 320 }}
          />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>API key</label>
          <input
            type="password"
            placeholder="API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ ...styles.input, minWidth: 320 }}
          />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>2. Fetch apps (optional)</h2>
        <p style={styles.hint}>
          Use your Personal Access Token to fetch your apps. Cloud App ID from Studio Pro may be wrong—use this to get the correct list.
        </p>
        <div style={styles.row}>
          <button
            onClick={loadApps}
            style={styles.btn}
            disabled={
              !!ui.loading ||
              !pat.trim()
            }
          >
            {ui.loading === LOADING_APPS ? "Loading…" : "Refresh apps"}
          </button>
        </div>
        {apps.length > 0 && (
          <>
            <div style={styles.row}>
              <label style={styles.label}>Select app</label>
              <select
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                style={styles.select}
              >
                <option value="">— {TEXT_PICK_APP} —</option>
                {apps.map((a) => (
                  <option key={a.ProjectId} value={a.ProjectId}>
                    {a.Name} ({a.ProjectId.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            </div>
            <AppInfoDisplay appId={appId} apps={apps} />
          </>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>3. App ID & environments</h2>
        <p style={styles.hint}>
          Cloud App ID (UUID). Enter manually or pick from the app list above.
        </p>
        <div style={styles.row}>
          <label style={styles.label}>App ID (UUID)</label>
          <input
            type="text"
            placeholder="e.g. 51c5e41f-58ae-4880-8025-4b2a0679334f"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            style={{ ...styles.input, minWidth: 320 }}
          />
        </div>
        {!canFetch && (
          <p style={styles.hint}>{TEXT_ENTER_CREDENTIALS}</p>
        )}
        {canFetch && (
          <>
            <button
              onClick={loadEnvironments}
              style={styles.btn}
              disabled={!!ui.loading}
            >
              {ui.loading === LOADING_ENVIRONMENTS
                ? "Loading…"
                : "Refresh environments"}
            </button>
            <div style={styles.row}>
              <label style={styles.label}>Environment</label>
              <select
                value={selectedEnv ? envId(selectedEnv) : ""}
                onChange={(e) => {
                  const env = environments.find(
                    (x) => envId(x) === e.target.value
                  );
                  setSelectedEnv(env ?? null);
                }}
                style={styles.select}
                disabled={!!ui.loading}
              >
                <option value="">
                  — {environments.length === 0 ? TEXT_CLICK_TO_LOAD : TEXT_PICK_ENVIRONMENT} —
                </option>
                {environments.map((e) => (
                  <option key={envId(e)} value={envId(e)}>
                    {envName(e)} ({envState(e)})
                  </option>
                ))}
              </select>
            </div>
            <EnvironmentInfoDisplay environment={selectedEnv} />
            <div style={styles.row}>
              <label style={styles.label}>Snapshot</label>
              <button
                onClick={loadSnapshots}
                style={styles.btn}
                disabled={!!ui.loading || !selectedEnv}
              >
                {ui.loading === LOADING_SNAPSHOTS ? "Loading…" : "Refresh snapshots"}
              </button>
              {environments.length > 0 &&
                snapshots.length === 0 &&
                !ui.loading &&
                !ui.error && (
                  <p style={styles.hint}>{TEXT_NO_SNAPSHOTS}</p>
                )}
              <select
                value={selectedSnapshot?.snapshot_id ?? ""}
                onChange={(e) => {
                  const s = snapshots.find(
                    (x) => x.snapshot_id === e.target.value
                  );
                  setSelectedSnapshot(s ?? null);
                }}
                style={styles.select}
                disabled={!!ui.loading}
              >
                {snapshots.map((s) => (
                  <option key={s.snapshot_id} value={s.snapshot_id}>
                    {formatDate(s.created_at)} - {s.comment || "Snapshot"} (v
                    {s.model_version ?? "?"})
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>4. Download database backup</h2>
        <button
          onClick={handleDownload}
          disabled={
            !canFetch ||
            !selectedSnapshot ||
            !!ui.loading ||
            !!ui.archiveProgress
          }
          style={styles.btnPrimary}
        >
          {ui.archiveProgress ?? "Download database backup (.gz)"}
        </button>
      </section>

      {ui.error && <div style={styles.error}>{ui.error}</div>}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Restore to local</h2>
        <p style={styles.hint}>
          After downloading, extract the .gz file, then restore the .backup file
          in pgAdmin to a new PostgreSQL database. Point your app configuration
          to that database. See{" "}
          <a
            href="https://docs.mendix.com/developerportal/operate/restore-backup-locally"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mendix docs
          </a>{" "}
          for details.
        </p>
      </section>
    </div>
  );
}
