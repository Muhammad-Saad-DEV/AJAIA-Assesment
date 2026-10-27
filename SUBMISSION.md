# Submission checklist

- Source code: this repository
- Live application URL: not deployed yet
- Demo accounts: Maya Chen (`maya@example.com`) and Theo Brooks (`theo@example.com`)
- Automated tests: `npm test` passed with 4 tests
- Production build: `npm run build` passed; Vite reports a non-blocking bundle-size warning from the PDF export dependency
- Documentation: `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`
- Walkthrough URL: see `VIDEO_URL.txt`; no video has been recorded yet
- Google Drive upload: not performed

## Remaining manual steps

1. Create a Neon PostgreSQL database and copy its connection string into Render as `DATABASE_URL`.
2. Create a Render Web Service from this repository with build command `npm install && npm run build` and start command `npm start`.
3. Set `NODE_ENV=production`; optionally set `CORS_ORIGIN` and `VITE_API_URL` only when using separate origins. Verify `/api/health`, create/edit/refresh, imports, sharing, quotas, deletion, and exports on the live service.
4. Record a 3 to 5 minute walkthrough and update `VIDEO_URL.txt` and this file.
5. Upload the complete project folder and supporting screenshots to one Google Drive folder.

Known limitations: the frontend uses a lightweight demo session switcher rather than production authentication, and the Render/Neon deployment still requires the owner's accounts and credentials. The application has not been deployed or given a live URL from this workspace.
