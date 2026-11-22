# Event OS

Greenfield business operating system for **We Decor Events** (Phase 1).

- **Backend:** [`apps/api/`](apps/api/) — NestJS modular monolith
- **Frontend:** [`apps/web/`](apps/web/) — React SPA (Sprint 1 UAT shell)
- **Docs:** [`docs/`](docs/) — architecture and Business Bible
- **Onboarding:** [`docs/22-developer-onboarding.md`](docs/22-developer-onboarding.md)

## Quick start

```bash
cd apps/api
cp .env.example .env
pnpm install
docker compose -f ../../infrastructure/docker/docker-compose.yml up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

API: http://localhost:3000 — Swagger: http://localhost:3000/docs

Web UI (with API running):

```bash
pnpm --dir apps/web dev
```

http://localhost:5173 — JWT login (refresh cookie); dev API may also accept `X-Tenant-Slug: we-decor`.
