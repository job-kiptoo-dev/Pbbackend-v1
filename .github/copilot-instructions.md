<!-- Workspace-specific Copilot instructions for paza-backend -->

# Quick purpose

This repo is a TypeScript + Express backend using TypeORM (Postgres) and JWT-based auth. The goal of this file is to give an AI/code assistant the minimal, repo-specific knowledge to be productive: architecture, common change patterns, developer flows, and important files/ENV keys to reference.

## Big picture (how it fits together)
- Entry: `src/index.ts` — config, middleware, Swagger, and route mounting.
- Routing layer: `src/routes/*.routes.ts` (e.g. `auth.routes.ts`) maps endpoints to controller methods.
- Controllers: `src/controllers/*` contain request handling and orchestration (call services, validate input).
- Services: `src/services/*` encapsulate external integrations and business work (e.g. `email.service.ts`, `social.verification.ts`).
- Persistence: `src/db/data-source.ts` (TypeORM DataSource) + entities in `src/db/entity/*`. Entities extend `BaseEntity` — the codebase uses TypeORM's Active Record pattern (e.g. `User.findOne(...)`).
- Middleware: `src/middleware/*` (notably `auth.middleware.ts`) attaches `req.user` after JWT verification.

Example request flow: client -> `routes/auth.routes.ts` -> `AuthController` -> `EmailService` / `User` entity -> DB via `AppDataSource`.

## Developer workflows & commands
- Install: `npm install`
- Dev server (fast reload): `npm run dev` (uses `ts-node-dev` and runs `src/index.ts`).
- Build: `npm run build` (TypeScript compiler -> `dist/`).
- Start production: `npm start` (runs `node dist/index.js`).
- Tests: `npm test` (Jest + ts-jest).
- Lint: `npm run lint` / `npm run lint:fix` (ESLint + TypeScript).

Use `npm run dev` for iterative development. The server initializes the TypeORM DataSource on startup (see `src/index.ts`) so DB env must be set before running dev.

## Important environment variables (used across the repo)
- PORT — server port (fallback 5000 in `src/index.ts`).
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE — TypeORM/Postgres (`src/db/data-source.ts`).
- JWT_SECRET — used by `src/middleware/auth.middleware.ts` and auth logic.
- EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM, EMAIL_FROM_NAME — `src/services/email.service.ts`.
- APP_URL / FRONTEND_URL — used in email links.

Note: `src/db/data-source.ts` sets `synchronize: true` which auto-syncs schemas. Be cautious in production.

## Project-specific conventions & patterns
- Active Record style TypeORM entities (classes extend `BaseEntity`) — use static methods like `User.findOne`, `User.save()`.
- Controllers are class-based (example: `AuthController` in `src/controllers/auth.controller.ts`) and instantiated in route files.
- Services return promises and throw on failure; controllers catch and map to HTTP responses.
- Centralized error handler and 404 handler live in `src/index.ts` (search for the error middleware block there).
- Swagger docs are embedded with JSDoc-style comments in routes/controllers and wired via `src/swagger.ts`.

## Integration points & examples
- Add a new entity: create file in `src/db/entity/`, export a class extending `BaseEntity`, then add it to `entities` array in `src/db/data-source.ts`.
- Add a new API: create route under `src/routes/`, controller under `src/controllers/`, and wire route in `src/index.ts` (mounting pattern: `app.use('/api/<name>', <route>)`).
- Auth: use `authenticate` middleware from `src/middleware/auth.middleware.ts`. The middleware expects an `Authorization: Bearer <token>` header and attaches `req.user`.

## Tests & quality gates
- Unit/integration tests use Jest (`npm test`). Look for `jest.config.js` at repo root.
- Linting via ESLint configured for TypeScript; run `npm run lint` and `npm run lint:fix`.

## When editing code, remember
- Keep controller logic thin — move complex logic to services.
- Because entities use Active Record, prefer `User.findOne(...)` and `user.save()`.
- When adding DB entities/relationships, update `src/db/data-source.ts` entities array.

## Where to look first (recommended file checklist)
- `src/index.ts` — server bootstrap and middleware.
- `src/db/data-source.ts` — DB connection and entities.
- `src/db/entity/User.ts` — example entity and Active Record pattern.
- `src/middleware/auth.middleware.ts` — JWT logic and request augmentation.
- `src/services/email.service.ts` — external SMTP integration and env keys.
- `src/routes/auth.routes.ts` & `src/controllers/auth.controller.ts` — primary auth flows (register/login/verify).

If anything in this file is unclear or you want more examples (e.g., a minimal patch that adds a new endpoint), tell me which area to expand and I'll iterate.
<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
<!-- TypeScript Express project requested -->

- [x] Scaffold the Project
    <!-- Create TypeScript Express project structure manually -->- [x] Customize the Project
<!-- Skip for Hello World project -->

- [x] Install Required Extensions
<!-- No specific extensions required -->

- [x] Compile the Project
    <!-- Install dependencies and compile -->- [x] Create and Run Task
<!-- Create development task -->

- [x] Launch the Project
<!-- Development server is running on port 3000 -->

- [x] Ensure Documentation is Complete
<!-- README.md and copilot-instructions.md are complete -->
