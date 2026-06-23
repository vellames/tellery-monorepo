# syntax=docker/dockerfile:1
# Monorepo Dockerfile for @ai-history/api.
# Build context MUST be the repository root (shared npm workspaces + turbo).
#   docker build -f apps/api/Dockerfile -t ai-history-api .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- Pruner: isolate the api workspace + its dependencies ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune @ai-history/api --docker

# ---- Builder: install deps, generate Prisma client, build ----
FROM base AS builder
WORKDIR /app
# Install dependencies using the pruned lockfile (better layer caching).
COPY --from=pruner /app/out/json/ .
RUN npm ci
# Bring in the pruned source and build.
COPY --from=pruner /app/out/full/ .
# turbo prune does not carry root-level shared tsconfig referenced via "extends".
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
# Root-level mocks/ are not part of any workspace package, so prune omits them.
COPY --from=pruner /app/mocks ./mocks
# Generate Prisma client.
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npx turbo run build --filter=@ai-history/api

# ---- Runner: production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/ .
WORKDIR /app/apps/api
EXPOSE 3232
# `npm start` runs `prisma migrate deploy` (safe, additive) then the server.
CMD ["npm", "start"]
