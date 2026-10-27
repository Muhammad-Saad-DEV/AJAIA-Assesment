# Papertrail

Papertrail is a focused collaborative document editor for the AJAIA LLC full stack assessment. It supports rich text editing, SQLite persistence, `.txt`/`.md` imports, demo account switching, and owner-controlled sharing.

## Stack

React + TypeScript + Vite, Express + TypeScript, PostgreSQL via `pg` for production, Node 24 built-in SQLite for local development, and TipTap.

## Prerequisites

Node.js 20+ and npm. The project was built with Node 24.22.1.

## Run locally

```sh
npm install
npm run dev
```

The UI is at `http://localhost:5173`; the API is at `http://localhost:3001`.

## Test and build

```sh
npm test
npm run build
```

Set `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, and `VITE_API_URL` in a `.env` file when needed. See `.env.example`. `DATABASE_URL` selects Neon PostgreSQL; when it is absent, local development uses `DB_FILE` and SQLite.

## Demo accounts

Use the account switch button in the lower-left corner to switch between Maya Chen (`maya@example.com`) and Theo Brooks (`theo@example.com`). Create a document as Maya, share it with Theo, then switch accounts to verify the shared view. Demo sessions use a validated backend user header because this assessment does not require production authentication.

## File imports

Only `.txt` and `.md` files smaller than 1 MB are accepted. Markdown headings beginning with `# ` are imported as level-two headings; plain text paragraphs are preserved.

## Scope

The product deliberately does not claim simultaneous real-time editing, version history, comments, or `.docx` parsing. SQLite is local and is appropriate for this single-instance assessment application.

## Production deployment

The recommended free setup is one Render Web Service backed by a Neon PostgreSQL database. The service builds and serves both frontend and API:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `/api/health`

Set these Render environment variables:

- `DATABASE_URL`: Neon connection string, kept secret
- `NODE_ENV=production`
- `CORS_ORIGIN`: optional comma-separated frontend origins; leave empty for the single-service same-origin setup
- `VITE_API_URL`: optional API origin for a separately hosted frontend; leave empty for the single-service setup
- `PORT`: supplied by Render automatically

On startup, a fresh Neon database receives the `users`, `documents`, `shares`, and `import_usage` tables plus the two demo users. No local SQLite file is used when `DATABASE_URL` is set. No deployment has been performed from this workspace and no live URL is claimed.
