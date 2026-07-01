# syntax=docker/dockerfile:1
# Monorepo Dockerfile for @ai-history/homepage.
# Build context MUST be the repository root (shared npm workspaces + turbo).
#   docker build -f apps/homepage/Dockerfile -t ai-history-homepage .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- Pruner: isolate the homepage workspace + its dependencies ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune @ai-history/homepage --docker

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
RUN npx turbo run build --filter=@ai-history/homepage

# ---- Runner: production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# `output: 'standalone'` traces only the files actually needed to run the
# server, so we can copy just that plus the static/public assets.
COPY --from=builder --chown=nextjs:nodejs /app/apps/homepage/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/homepage/.next/static ./apps/homepage/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/homepage/public ./apps/homepage/public

EXPOSE 3939
ENV PORT=3939
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/homepage/server.js"]
