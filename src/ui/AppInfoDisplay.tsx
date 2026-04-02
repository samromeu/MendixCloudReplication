import React from "react";
import type { MendixApp } from "../services/mendixApi";
import { styles } from "./styles";

interface AppInfoDisplayProps {
  appId: string;
  apps: MendixApp[];
}

/**
 * Display detailed info for the currently selected app.
 */
export function AppInfoDisplay({ appId, apps }: AppInfoDisplayProps) {
  const selected = apps.find((a) => a.ProjectId === appId);
  if (!selected || !appId) return null;

  return (
    <div style={styles.appInfo}>
      <h3 style={styles.appInfoTitle}>Selected app</h3>
      <div style={styles.appInfoRow}>
        <strong>Name:</strong> {selected.Name}
      </div>
      <div style={styles.appInfoRow}>
        <strong>Project ID:</strong> <code style={styles.code}>{selected.ProjectId}</code>
      </div>
      {selected.AppId && selected.AppId !== selected.ProjectId && (
        <div style={styles.appInfoRow}>
          <strong>App ID:</strong> <code style={styles.code}>{selected.AppId}</code>
        </div>
      )}
      {selected.Url && (
        <div style={styles.appInfoRow}>
          <strong>URL:</strong>{" "}
          <a href={selected.Url} target="_blank" rel="noopener noreferrer" style={styles.link}>
            {selected.Url}
          </a>
        </div>
      )}
    </div>
  );
}
