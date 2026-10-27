# Architecture

The Vite React client owns the dashboard, editor state, debounced autosave, import flow, share dialog, and browser-side exports. TipTap stores documents as JSON so formatting survives reloads. In production, Express serves the generated `dist` directory and the client uses same-origin `/api` requests; `VITE_API_URL` is available for a split-origin deployment.

The Express API is intentionally small. Every protected request validates `x-user-id` against the seeded users table, then checks document ownership or a row in `shares`. Only owners can update or share documents. Errors use `{ error: string }` responses.

`server/db.ts` provides a small adapter with two modes. Local development uses Node 24's built-in SQLite adapter and `DB_FILE`; production uses Neon PostgreSQL when `DATABASE_URL` is set. Both modes initialize `users`, `documents`, `shares`, and `import_usage`, and seed two demo users without resetting existing data. PostgreSQL transactions protect concurrent import quota checks. The local database file is ignored by git and is never used in production.

The Render deployment is intentionally a single web service so the built frontend and API share an origin. Real-time presence, production authentication, comments, history, and `.docx` parsing remain out of scope. Demo authentication is still a validated account header, not production identity management.
