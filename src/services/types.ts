/**
 * Shared types used by the Mendix API client and UI.
 */

export interface MendixApp {
  ProjectId: string;
  Name: string;
  AppId: string;
  Url: string;
}

/** v4 environment format from GET /api/v4/apps/{appId}/environments */
export interface MendixEnvironment {
  id: string;
  name: string;
  state: string;
  url?: string;
  planName?: string;
  dbVersion?: string;
}

/** v1 environment format (for compatibility if we ever fall back) */
export interface MendixEnvironmentV1 {
  EnvironmentId: string;
  Mode: string;
  Url: string;
  Status: string;
}

export interface Snapshot {
  snapshot_id: string;
  model_version: string | null;
  comment: string;
  state: string;
  created_at: string;
  finished_at: string | null;
  expires_at: string;
}

export interface Archive {
  archive_id: string;
  snapshot_id: string;
  data_type: string;
  state: string;
  url: string | null;
  status_message: string | null;
}

/**
 * Credentials object for API‑key based auth.
 */
export interface ApiKeyAuth {
  username: string;
  apiKey: string;
}
