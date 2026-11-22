# Event OS API — multi-stage production image (R2-01 / docs/16 §Containerization).
#
# Docs/16 template used node:20 and `dist/main.js`. The repository is authoritative
# for runtime details (docs/22, package.json engines, `pnpm start:prod`):
#   - Node.js 22 LTS
#   - entrypoint: `node dist/src/main` (Nest emits dist/src/main.js)
#   - default container PORT 4000 (docs/16 compose mapping)
#
# Build context: apps/api/

# ---------------------------------------------------------------------------
# Builder — install all deps, generate Prisma client, compile NestJS
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl \
  && corepack enable \
  && corepack prepare pnpm@10.13.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# prisma.config.ts requires DATABASE_URL to resolve at config-load time.
# Generate does not connect; a placeholder is enough for the build stage.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"

RUN pnpm install --frozen-lockfile

COPY . .

# `prebuild` → `prisma generate`; `build` → `nest build`
RUN pnpm build

# Drop devDependencies so the runtime layer only ships production modules
# (bcrypt native bindings and the generated Prisma client remain).
RUN pnpm prune --prod

# ---------------------------------------------------------------------------
# Runner — minimal production image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl \
  && addgroup -S eventos \
  && adduser -S eventos -G eventos

ENV NODE_ENV=production \
    PORT=4000

COPY --from=builder --chown=eventos:eventos /app/package.json ./package.json
COPY --from=builder --chown=eventos:eventos /app/dist ./dist
COPY --from=builder --chown=eventos:eventos /app/node_modules ./node_modules
COPY --from=builder --chown=eventos:eventos /app/prisma ./prisma
COPY --from=builder --chown=eventos:eventos /app/prisma.config.ts ./prisma.config.ts

USER eventos

EXPOSE 4000

# Orchestrator-friendly liveness probe (compose also defines a healthcheck).
# Use Node fetch — alpine runner has no wget/curl (matches compose healthcheck).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Matches package.json `start:prod`
CMD ["node", "dist/src/main.js"]
