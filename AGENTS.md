# AGENTS.md

## Commands

### Install dependencies

```sh
npm install
```

### Development

```sh
npm run dev          # start api dev server (nodemon + ts-node) on port 3232
```

### Docker (development)

```sh
npm run docker:dev          # start postgres + api
npm run docker:dev:down     # stop all containers
npm run docker:dev:logs     # tail container logs
```

### Database migrations

Prisma schema lives at `apps/api/prisma/schema.prisma`. The `.env` file at the repo root provides `DATABASE_URL`.

Start Postgres first:

```sh
docker-compose -f apps/api/docker-compose.yml up -d postgres
```

Create and apply a new migration after changing the schema:

```sh
npm run db:migrate -w @ai-history/api -- --name <migration_name>
```

Push schema changes without creating a migration (useful for prototyping):

```sh
npm run db:push -w @ai-history/api
```

Regenerate the Prisma client after schema changes:

```sh
npm run db:generate -w @ai-history/api
```

Open Prisma Studio to inspect data:

```sh
npm run db:studio -w @ai-history/api
```

### Build

```sh
npm run build        # turbo run build (builds all workspaces)
```

### Lint and typecheck

```sh
npm run lint         # turbo run lint
npm run typecheck    # turbo run typecheck
npm run verify       # format + lint + typecheck + build + test
```

### Testing

```sh
npm run test              # turbo run test
npm run test -w @ai-history/api          # run api tests only
npm run test:watch -w @ai-history/api    # watch mode
npm run test:coverage -w @ai-history/api # with coverage report
```

## Conventions

- Monorepo with `turbo` + npm workspaces (`apps/*`, `packages/*`).
- API code lives in `apps/api/src/`.
- Shared i18n lives in `packages/i18n/`.
- Repository interfaces live in `apps/api/src/interfaces/repositories/`.
- Repositories extend `BaseRepository` and implement their interface.
- Services depend on repository interfaces, not concrete classes.
- Dependency injection via `apps/api/src/container/di.container.ts`.
- Config is centralized in `apps/api/src/config/app.config.ts` as a nested `appConfig` object.
- Environment variables are loaded from the root `.env` file (symlinked into `apps/api/` for Prisma).
- API runs on port 3232. Postgres runs on port 5555.
- Commit messages are lowercase and imperative (e.g. `add prisma with postgres`).

### Web (`apps/web`)

- The browser never calls the backend API (port 3232) directly. All API calls go through a **BFF route handler** in `apps/web/src/app/api/**/route.ts`, which uses `apiFetch` (server-only, injects the session token + locale) and **forwards the backend's HTTP status code**.
- The default pattern for any backend-mediated action is: **BFF route handler → client fetcher (`lib/api/*`) → React Query mutation hook (`lib/hooks/*`)**. Toasts (sonner) handle success/error feedback. `useLogin`, `useUpdateProfile`, `useChangePassword` are the canonical examples.
- **Server actions (`'use server'`) are reserved for non-API concerns** — e.g. `setLocale` writes a cookie and never touches the backend. Do **not** use server actions for API calls; they swallow HTTP status codes (always 200) and break the BFF status-forwarding contract.

## Mandatory practices

- **Unit tests are required.** Every repository, service, and controller must have unit tests. Tests run as part of `npm run verify` — no PR is complete without passing tests.
- **Swagger documentation is required.** Every new endpoint must be documented with JSDoc `@openapi` annotations in its route file. Undocumented endpoints are not allowed.
- **SOLID principles must be followed:**
  - **Single Responsibility:** each class does one thing — controllers handle HTTP, services contain business logic, repositories handle persistence.
  - **Open/Closed:** extend behavior through new classes or interfaces, not by modifying existing ones.
  - **Liskov Substitution:** any repository implementation must be substitutable through its interface without breaking the service.
  - **Interface Segregation:** interfaces should be small and focused — don't force implementations to depend on methods they don't use.
  - **Dependency Inversion:** services depend on interfaces (`IUserRepository`), never on concrete classes (`UserRepository`).
- **No magic numbers or magic strings.** Never inline raw literals where a named constant exists. HTTP status codes must use the `StatusCodes` enum from the `http-status-codes` package (e.g. `StatusCodes.NOT_FOUND`, never `404`); the same applies to error message keys, route paths, and other repeatable literals — extract them to a constant, enum, or config.
- **HTTP status codes:**
  - Always reference these via the `StatusCodes` enum (e.g. `StatusCodes.UNPROCESSABLE_ENTITY`), never as numeric literals.
  - `422 Unprocessable Entity` — invalid user input (failed Zod validation, missing required fields, bad values). This is the default for validation errors.
  - `400 Bad Request` — protocol-level errors only (malformed JSON, wrong content-type, Prisma-level errors). Never use 400 for user data validation.
  - `404 Not Found` — resource does not exist.
  - `409 Conflict` — duplicate resource (e.g. email already in use).
  - `401 Unauthorized` — missing or invalid credentials/authentication token.
  - `500 Internal Server Error` — unexpected server errors.
