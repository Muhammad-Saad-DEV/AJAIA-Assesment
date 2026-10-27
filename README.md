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

The recommended free setup is Vercel Hobby backed by a Neon PostgreSQL database. Vercel recognizes the root `index.ts` Express export, builds the Vite frontend into `public`, and serves the frontend assets while routing requests to the Express function.

Vercel project settings:

- Build command: `npm run build`
- Install command: `npm install --include=dev`
- Leave the framework preset and output directory at automatic detection. The build writes frontend assets to `public`, and Vercel serves that directory while the root Express export handles API requests.
- Do not add a custom runtime declaration.

Set these Vercel environment variables:

- `DATABASE_URL`: Neon connection string, kept secret
- `NODE_ENV=production`
- `CORS_ORIGIN`: optional comma-separated frontend origins; leave empty for the same-origin setup
- `VITE_API_URL`: optional API origin for a separately hosted frontend; leave empty for the same-origin setup
- `PORT`: not required for Vercel; local `npm start` defaults to 3001

On cold start, a fresh Neon database receives the `users`, `documents`, `shares`, and `import_usage` tables plus the two demo users. `DATABASE_URL` is required by the Vercel entrypoint, so no local SQLite file is used in production. No deployment has been performed from this workspace and no live URL is claimed.
