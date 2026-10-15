# MendixCloudReplication

A Mendix Studio Pro extension that pulls a database backup from any deployed Mendix Cloud environment, so you can restore it locally and reproduce production issues against real data, without leaving Studio Pro.

## Why

Debugging a production issue usually means getting production-like data onto your machine. In the standard workflow you open the Mendix Portal, find the environment, request a backup archive, wait for it, download it, then restore it. This extension brings that flow into Studio Pro as a guided, four-step panel.

## How it works

1. **Authenticate:** enter a Mendix Personal Access Token, plus an API username and key for the Backups API. Credentials are saved locally for next time.
2. **Pick an app and environment:** lists your apps and their environments via the **Mendix Deploy API v4**.
3. **Pick a snapshot:** lists completed backups for that environment via the **Mendix Backups API v2**.
4. **Download:** requests a database-only archive, polls until it's ready and downloads the `.gz` file.

You then restore the `.backup` file into a local PostgreSQL database (see [Mendix docs](https://docs.mendix.com/developerportal/operate/restore-backup-locally)) and point your local app configuration at it.

### Technical notes

- **CORS workaround:** the Backups API (`deploy.mendix.com`) doesn't send CORS headers, so browser-based clients, including Studio Pro's webview, are normally blocked. The extension routes these calls through Studio Pro's built-in HTTP proxy (`studioPro.network.httpProxy`) to get around this.
- **Two auth schemes:** the Deploy API uses a Personal Access Token (`Authorization` header), while the Backups API uses `Mendix-Username` and `Mendix-ApiKey` headers. The client picks the right headers per API.
- **Async archive creation:** archives are created asynchronously, so the client polls the archive status every 2 seconds, with a cap on the number of attempts, and shows progress in the UI.
- **Clear error handling:** requests have timeouts, and errors say which call failed and why, such as auth problems versus CORS or network failures.

## Tech stack

- TypeScript
- React 18
- Mendix Extensions API (`@mendix/extensions-api`)
- esbuild

## Prerequisites

- Node.js 18+ and npm
- Mendix Studio Pro, compatible with the extension API version in `package.json`
- A Mendix **Personal Access Token** with `mx:deployment:read` (and `mx:deployment:write` to create archives)
- A Mendix **API key** and **Backups access** on the target environments

## Getting started

```bash
npm install
```

Set `appDir` in `build-extension.mjs` to the folder of the local Mendix app you want to load the extension into. The build copies the bundle into that app's `extensions` folder.

```bash
npm run build       # production build
npm run build:dev   # rebuild on change
```

Open the app in Studio Pro with extension development enabled, then go to **Extensions → Mendix Cloud Connector → Open Cloud Connector**.

## Project structure

```
src/
├── main/       Extension entry point: registers the Extensions menu item and opens the tab
├── services/   Typed API clients for the Deploy API v4 and Backups API v2, plus HTTP, header and type helpers
└── ui/         React UI for the step-by-step flow
```

## License

MIT
