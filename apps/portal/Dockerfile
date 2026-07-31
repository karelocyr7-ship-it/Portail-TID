FROM node:24.18.0-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/portal/package.json apps/portal/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/portal/node_modules ./apps/portal/node_modules
COPY . .
RUN pnpm --filter portal exec prisma generate
RUN pnpm --filter portal build:worker
RUN pnpm --filter portal build
RUN pnpm --filter portal deploy --prod --legacy /tmp/portal-runtime
RUN cp -a /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma /tmp/portal-runtime/node_modules/.pnpm/@prisma+client@*/node_modules/

FROM node:24.18.0-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_PATH=/app/worker-node_modules
WORKDIR /app
RUN groupadd --system --gid 1001 portal && useradd --system --uid 1001 --gid portal portal
COPY --from=builder --chown=portal:portal /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=portal:portal /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder --chown=portal:portal /app/apps/portal/public ./apps/portal/public
COPY --from=builder --chown=portal:portal /app/apps/portal/.worker-dist ./apps/portal/.worker-dist
COPY --from=builder --chown=portal:portal /tmp/portal-runtime/node_modules ./worker-node_modules
USER portal
EXPOSE 3000
CMD ["node", "apps/portal/server.js"]
