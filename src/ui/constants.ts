/**
 * UI Constants and shared configuration
 */

export const CREDENTIALS_STORAGE_KEY = "mendixCloudConnector.credentials";
export const DEFAULT_BASE_URL = "https://cloud.home.mendix.com";
export const DEFAULT_PATH_PREFIX = "api";
export const ARCHIVE_POLL_INTERVAL_MS = 2000;
export const ARCHIVE_POLL_MAX_ATTEMPTS = 150;
export const FETCH_TIMEOUT_MS = 15000;

// UI state messages
export const LOADING_APPS = "Loading apps…";
export const LOADING_ENVIRONMENTS = "Loading environments…";
export const LOADING_SNAPSHOTS = "Loading snapshots…";
export const LOADING_CREATING_ARCHIVE = "Creating archive…";
export const LOADING_DOWNLOADING = "Downloading…";

// UI display text
export const TEXT_ENTER_CREDENTIALS = "Enter a PAT and App ID above, then click Refresh environments.";
export const TEXT_PICK_ENVIRONMENT = "Pick an environment";
export const TEXT_CLICK_TO_LOAD = "Click Refresh environments to load";
export const TEXT_NO_SNAPSHOTS = "No snapshots yet. Create a backup in the Mendix Portal (Backups tab) for this environment.";
export const TEXT_PICK_APP = "Pick an app";
export const TEXT_TRUNCATED_APP_ID = "…";

// Error messages
export const ERROR_FAILED_APPS = "Failed to load apps";
export const ERROR_FAILED_ENVIRONMENTS = "Failed to load environments";
export const ERROR_FAILED_SNAPSHOTS = "Failed to load snapshots";
export const ERROR_FAILED_DOWNLOAD = "Download failed";
