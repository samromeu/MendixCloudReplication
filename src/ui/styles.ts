/**
 * Styling for the Mendix Cloud Connector UI
 */

export const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "Segoe UI, system-ui, sans-serif",
    padding: 24,
    maxWidth: 600,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    margin: "0 0 4px 0",
  },
  subtitle: {
    color: "#666",
    margin: "0 0 24px 0",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 8px 0",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    margin: "0 0 12px 0",
  },
  row: {
    marginBottom: 12,
  },
  appInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f5f8fa",
    borderRadius: 6,
    border: "1px solid #e1e8ed",
  },
  appInfoTitle: {
    fontSize: 13,
    fontWeight: 600,
    margin: "0 0 8px 0",
  },
  appInfoRow: {
    fontSize: 12,
    marginBottom: 4,
  },
  code: {
    fontSize: 11,
    backgroundColor: "#e8eef2",
    padding: "2px 6px",
    borderRadius: 4,
  },
  link: {
    color: "#053c6e",
    fontSize: 12,
  },
  label: {
    display: "block",
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    padding: "8px 12px",
    marginRight: 8,
    marginBottom: 8,
  },
  select: {
    padding: "8px 12px",
    minWidth: 240,
  },
  btn: {
    padding: "8px 16px",
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    backgroundColor: "#053c6e",
    color: "white",
    border: "none",
  },
  error: {
    padding: 12,
    marginTop: 16,
    backgroundColor: "#fde8e8",
    color: "#c00",
    borderRadius: 4,
    fontSize: 13,
  },
};
