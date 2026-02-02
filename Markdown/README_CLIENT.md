# Paza Backend — Client README

This document explains the Paza backend project in client-facing terms: what it does, how it works, how to run it for demos or local testing, and what remains to be done for production readiness.

---

## 1. Project Summary

- Name: Paza Backend
- Type: REST API backend built with TypeScript, Express, and TypeORM (Postgres)
- Purpose: Manage users, campaigns, jobs (job board), collaborations/invitations, and creator profiles. It supports email-based account verification, password reset, and Google OAuth sign-in.

Primary features:
- User auth (register, verify email, login, reset password, Google OAuth)
- Account types (Individual, Business, Creator)
- Creator profiles
- Campaigns (with milestones, teams, feedback)
- Job board (create jobs, proposals, manage proposals)
- Collaboration invites and membership (campaign/business collaboration)
- Email integration for verification and password reset
- Seeder to populate demo data for quick testing

---

## 2. Technologies & Patterns

- Node.js + TypeScript
- Express.js for HTTP routes
- TypeORM (Active Record pattern) for DB access
- Postgres as the database
- JWT for authentication
- nodemailer for email sending
- ts-node-dev for local development
- Jest configured for tests (run `npm test`)

Architecture pattern:
- `routes/` map endpoints to controller methods
- `controllers/` handle request validation and orchestration
- `services/` contain business logic and external integrations (email, social verification, job/campaign logic)
- `db/entity/` contains TypeORM entities (Active Record style)

---

## 3. Important Files & Folders

- `src/index.ts` — server bootstrap, middleware, route wiring, Swagger
- `src/db/data-source.ts` — TypeORM DataSource configuration
- `src/db/entity/` — DB models: `User`, `CreatorProfile`, `Campaign`, `Job`, `CollaborationEntity`, etc.
- `src/controllers/` & `src/services/` — main app logic
- `src/middleware/auth.middleware.ts` — JWT verification middleware
- `src/seeds/seed.ts` — seed script to populate demo data
- `README_CLIENT.md` — this file (client-facing)

---

## 4. Setup & Quick Start (for demos / local testing)

Prerequisites:
- Node.js (>=16)
- npm
- Postgres instance (local Docker or hosted)

1) Install dependencies:

```bash
cd /path/to/paza-backend
npm install
```

2) Environment variables
- Copy `.env` or create a `.env` file in the project root. Key variables used by the app follow below (full list in repo `.env`):

- `NODE_ENV` (development/production)
- `PORT` (defaults to 5000)
- Postgres: either `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `RENDER` — set to `true` if connecting to a hosted DB that requires SSL (this repo's `data-source.ts` checks `RENDER` to set SSL options)
- `JWT_SECRET` — secret used to sign JWTs
- Email config: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
- `APP_URL` — used in verification email links

Example quick `.env` snippet:

```
NODE_ENV=development
PORT=5000
RENDER=true
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@example.com
EMAIL_PASSWORD=secret
EMAIL_FROM=noreply@paza.app
APP_URL=http://localhost:5000
```

3) Run the server in development mode:

```bash
npm run dev
```

4) Seed demo data (optional, useful for client demos)

```bash
# If your DB requires TLS/SSL and you rely on the RENDER flag to enable it
RENDER=true npm run seed

# Otherwise
npm run seed
```

Seeded demo accounts (created by the seeder):
- `creator@example.com` / `Password123!` — a Creator account (isVerified=true)
- `alice@example.com` / `Password123!` — a regular user (isVerified=true)

These allow immediate login without email verification in local demos.

---

## 5. Scripts (package.json)

- `npm run dev` — development server with auto-reload
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled server from `dist/`
- `npm run seed` — run seeder to populate demo data
- `npm test` — run tests
- `npm run lint` / `npm run lint:fix` — run ESLint

---

## 6. Key API Endpoints (quick reference)

Auth
- `POST /api/auth/register` — register a new user
- `GET /api/auth/verify/:token` — verify email by token
- `POST /api/auth/resend-verification` — resend verification email
- `POST /api/auth/login` — login, returns a JWT `token` (expires in 1 day)
- `PUT /api/auth/account-type` — update account type (requires authentication)

Jobs (Job Board)
- `GET /api/jobs` — list jobs (public)
- `GET /api/jobs/:id` — get job details (public)
- `POST /api/jobs` — create job (requires `Authorization: Bearer <token>`; creator account expected)
- `POST /api/jobs/:id/proposals` — create proposal for a job (authenticated)
- `GET /api/jobs/:id/proposals` — list proposals for job (public)

Campaigns
- `GET /api/campaigns` — list campaigns
- `POST /api/campaigns` — create campaign (authenticated)
- Additional endpoints for milestones, teams, feedback are implemented under `/api/campaigns`

Collaborations
- `POST /api/collaborations` — invite a user / create a collaboration (authenticated)
- `GET /api/collaborations` — list collaborations (varies by route implementation)

Notes on protected endpoints:
- All protected routes require the `Authorization` header: `Authorization: Bearer <JWT>`
- The `authenticate` middleware verifies the token and attaches `req.user` (TypeORM `User` entity) and `req.userId` for controller use.

---

## 7. How authentication & verification work (simple)

- Registration creates a user with `isVerified=false` and generates a `verificationToken`. An email is sent with a link to verify (`/api/auth/verify/:token`).
- Login checks `isVerified` and password; if verified, the server returns a JWT token valid for 24 hours.
- For local demos, seeded users are already verified and can log in right away.

Using the token (client):
- Add HTTP header: `Authorization: Bearer <TOKEN>` to requests requiring authentication (e.g., creating jobs, proposals, updating account type).

---

## 8. Database & Migrations

- This project currently sets `synchronize: true` in `src/db/data-source.ts`. That is convenient for local development but dangerous in production (it can drop/alter tables automatically).
- For production use, replace `synchronize: true` with explicit TypeORM migrations. I recommend adding migration scripts and running `npm run typeorm migration:run` during deployments.

---

## 9. Security & Production Notes

- Keep `JWT_SECRET` and email credentials secret and never commit them to source control.
- Use TLS for DB connections to hosted Postgres (the repo uses `RENDER=true` to toggle SSL options for Render-hosted DBs).
- Consider adding refresh tokens and rotating them for better session handling.
- Add rate limiting and request validation for all write endpoints.
- Add input validation (class-validator) to DTOs if not already present for stricter checks.
- Configure central logging and error monitoring (e.g., Sentry) before production rollout.

---

## 10. Testing & Quality

- Run unit and integration tests: `npm test`
- Lint: `npm run lint` and `npm run lint:fix` to correct formatting/style issues.

---

## 11. Deployment suggestions

- Containerize the app (Dockerfile present) and use the included `docker-compose.yml` for local stacks.
- Use environment variables in your hosting provider (Render, Heroku, AWS, etc.). Ensure DB connection uses SSL when required.
- Add a CI workflow (GitHub Actions) to run lint/build/tests and to run migrations before deploy.

---

## 12. Data model summary (high-level)

- `User` — core account, can own `Job`, `Campaign`, can have `CreatorProfile` and `BusinessMember` entries
- `CreatorProfile` — one-to-one with `User` (stores creator details)
- `Campaign` — has `milestones`, `teams`, `feedback` and optional `creator` (User)
- `Job` — belongs to a `User` (owner) and has `JobProposal` entries
- `CollaborationEntity` — links users to campaigns or businesses with invite flow and roles

(If you want, I can add a visual ER diagram to `docs/erd.md`.)

---

## 13. Deliverables & Next Steps for Production (recommended)

- Add TypeORM migrations and remove `synchronize: true` for production
- Add CI (GitHub Actions) to run lint/build/tests and deploy
- Add more automated tests (critical flows: auth, job create/proposal, collaboration invite/accept)
- Add structured logs & error reporting
- Implement refresh token flow or shorten access token lifetime and rotate tokens
- Review and implement rate limiting for public endpoints

---

## 14. Contact & Handoff

If you'd like, I can:
- Produce a short recorded demo of the main flows (register, login, create job) for your client
- Generate a PDF version of this README for inclusion in the client handoff
- Add an ER diagram and/or export a Postgres schema SQL file

Tell me which of the above you'd like and I will prepare it.

---

Thank you — this backend is ready for local demos and quick client walkthroughs. For production readiness we should complete the migration & CI steps listed under "Next Steps."