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
npm run verify       # format + lint + typecheck + build
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
