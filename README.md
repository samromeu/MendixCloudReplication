# MendixCloudReplication

Mendix Studio Pro extension project for connecting to Mendix Cloud APIs.

## Tech Stack

- TypeScript
- React 18
- Mendix Extensions API (`@mendix/extensions-api`)
- esbuild

## Prerequisites

- Node.js 18+
- npm
- Mendix Studio Pro (compatible with your installed extension API version)

## Getting Started

```bash
npm install
```

## Build

Create a production build of the extension:

```bash
npm run build
```

Run build in watch mode during development:

```bash
npm run build:dev
```

## Project Structure

- `src/main/`: extension entrypoint and host integration
- `src/services/`: HTTP and Mendix API service layer
- `src/ui/`: React UI components
- `dist/`: generated extension bundle output (ignored by git)

## License

MIT
