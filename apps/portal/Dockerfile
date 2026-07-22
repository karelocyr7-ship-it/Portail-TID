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
RUN pnpm --filter portal build

FROM node:24.18.0-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN groupadd --system --gid 1001 portal && useradd --system --uid 1001 --gid portal portal
COPY --from=builder --chown=portal:portal /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=portal:portal /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder --chown=portal:portal /app/apps/portal/public ./apps/portal/public
USER portal
EXPOSE 3000
CMD ["node", "server.js"]
