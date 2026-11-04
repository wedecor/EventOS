# Event OS Admin Portal (`apps/web`)

Client-first Next.js 15 App Router application with **static export** (`output: 'export'`).

- NestJS (`apps/api`) is the only backend
- No SSR, Server Actions, or Route Handlers
- Consumes the frozen OpenAPI contract at `apps/api/openapi/openapi.v1.json`

## Quick start

```bash
cd apps/web
cp .env.example .env.local
pnpm install
pnpm dev
```

App: http://localhost:3001  
API (default): http://localhost:3000

Ensure API `CORS_ORIGIN` includes `http://localhost:3001` when not using development wildcard.

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Dev server on port 3001 |
| `pnpm build` | Static export to `out/` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm openapi:generate` | Regenerate `src/types/api.generated.ts` from frozen OpenAPI |

## Scope (F1-01)

Foundation only: shell, shared UI, API client, auth wiring. No CRM/dashboard/business screens.
