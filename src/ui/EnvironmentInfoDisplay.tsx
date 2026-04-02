import React from "react";
import type { MendixEnvironment, MendixEnvironmentV1 } from "../services/mendixApi";
import { envId, envName, envState } from "../services/mendixApi";
import { styles } from "./styles";

interface EnvironmentInfoDisplayProps {
  environment: MendixEnvironment | MendixEnvironmentV1 | null;
}

/**
 * Display detailed info for the currently selected environment.
 */
export function EnvironmentInfoDisplay({ environment }: EnvironmentInfoDisplayProps) {
  if (!environment) return null;

  const envIdValue = envId(environment);
  const envNameValue = envName(environment);
  const envStateValue = envState(environment);
  const envUrl = "url" in environment ? environment.url : (environment as MendixEnvironmentV1).Url;
  const planName = "planName" in environment ? environment.planName : undefined;
  const dbVersion = "dbVersion" in environment ? environment.dbVersion : undefined;

  return (
    <div style={styles.appInfo}>
      <h3 style={styles.appInfoTitle}>Selected environment</h3>
      <div style={styles.appInfoRow}>
        <strong>Name:</strong> {envNameValue}
      </div>
      <div style={styles.appInfoRow}>
        <strong>Environment ID:</strong> <code style={styles.code}>{envIdValue}</code>
      </div>
      <div style={styles.appInfoRow}>
        <strong>State:</strong> <span style={{ textTransform: "capitalize" }}>{envStateValue}</span>
      </div>
      {planName && (
        <div style={styles.appInfoRow}>
          <strong>Plan:</strong> {planName}
        </div>
      )}
      {dbVersion && (
        <div style={styles.appInfoRow}>
          <strong>DB Version:</strong> {dbVersion}
        </div>
      )}
      {envUrl && (
        <div style={styles.appInfoRow}>
          <strong>URL:</strong>{" "}
          <a href={envUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
            {envUrl}
          </a>
        </div>
      )}
    </div>
  );
}
