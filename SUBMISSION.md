# Papertrail — AJAIA Full Stack Assessment

## Project

Papertrail is a lightweight collaborative document editor built with React, TypeScript, Express, TipTap, and PostgreSQL.

## Links

- **GitHub repository:** https://github.com/Muhammad-Saad-DEV/AJAIA-Assesment
- **Live deployment:** https://papertrail-assessment.vercel.app
- **Walkthrough video:** https://drive.google.com/file/d/1fo6VtCzcmjTedn34keW98mfm8BBRpA3m/view?usp=drive_link
- **Submission folder:** https://drive.google.com/drive/folders/1jfoiohE4h-64y3nVyYQAVAsTMKUyfSw9?usp=sharing

## Local setup

Requirements: Node.js 24 or a compatible version and npm.

1. Download or clone the repository.
2. Install dependencies with `npm install`.
3. Configure environment variables as needed using `.env.example`.
4. Run the application with `npm run dev`.
5. Run tests with `npm test`.
6. Build for production with `npm run build`.

Local development uses SQLite by default. Production deployment is configured to use PostgreSQL through `DATABASE_URL`.

## Demo accounts

The application includes demo users Maya Chen (`maya@example.com`) and Theo Brooks. Use the account-switching control in the application to test document sharing between users.

## Implemented features

- Document creation, editing, saving, and reopening
- Rich-text editing
- Document sharing and access control
- Text and Markdown imports
- PDF and Markdown exports
- Import quotas and simulated subscription upgrades
- Document deletion with owner restrictions
- Automated tests and deployment configuration

## Known limitation

The application works locally, and the automated test suite passes. The live Vercel deployment serves the frontend and its `/api/health` endpoint successfully, with the health endpoint confirming PostgreSQL connectivity. However, the live frontend currently displays a JSON parsing error during startup, so the deployed application is not yet fully functional. Please use the local setup instructions to evaluate the complete application.

## AI workflow

AI assistance was used to support implementation, debugging, deployment configuration, and documentation. Changes were validated with automated tests, TypeScript checks, production builds, and local manual testing. Deployment-specific issues were investigated separately; the live startup issue remains unresolved.
