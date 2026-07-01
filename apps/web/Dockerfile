# syntax=docker/dockerfile:1
# Monorepo Dockerfile for @ai-history/web.
# Build context MUST be the repository root (shared npm workspaces + turbo).
#   docker build -f apps/web/Dockerfile -t ai-history-web .

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- Pruner: isolate the web workspace + its dependencies ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune @ai-history/web --docker

# ---- Builder: install deps and build the Next.js app ----
FROM base AS builder
WORKDIR /app
# Install dependencies using the pruned lockfile (better layer caching).
COPY --from=pruner /app/out/json/ .
RUN npm ci
# Bring in the pruned source and build.
COPY --from=pruner /app/out/full/ .
# turbo prune does not carry root-level shared tsconfig referenced via "extends".
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
RUN npx turbo run build --filter=@ai-history/web

# ---- Runner: production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# `output: 'standalone'` traces only the files actually needed to run the
# server, so we can copy just that plus the static/public assets.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
