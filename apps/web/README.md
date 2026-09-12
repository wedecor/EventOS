# Event OS Web

Sprint 1 admin SPA (React 19 + Vite + TanStack Query + Tailwind).

**Routes:** login · leads (list with client names, create with client picker) · clients · quotations (W5) · bookings (activate + inline suggestions) · suggestions. Uses `GET /auth/me` for staff-assign defaults.

## Dev

From repo root:

```bash
pnpm install
# Terminal 1 — API on :3000 (see apps/api)
pnpm --dir apps/api start:dev
# Terminal 2 — web on :5173 (proxies /api → API)
pnpm --dir apps/web dev
```

Open http://localhost:5173 — sign in with seeded admin (`apps/api/prisma/seed.ts`).

Ensure API `CORS_ORIGIN` includes `http://localhost:5173` and `credentials: true` (default in `main.ts`).

## Build

```bash
pnpm --dir apps/web build
```
