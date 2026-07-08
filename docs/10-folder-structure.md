# Folder Structure

## Purpose of This Document

This document defines the complete directory structure for the Event OS codebase. Every file has a place. Deviations require an ADR ([12-architecture-decisions.md](./12-architecture-decisions.md)).

---

## Repository Layout

```
event-os/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, test, build on PR
│   │   ├── deploy-staging.yml        # Deploy to staging on merge to main
│   │   └── deploy-production.yml     # Deploy to production on release tag
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── docs/                             # Engineering documentation (this folder)
│   ├── 01-company.md
│   ├── 02-product-vision.md
│   └── ... (all 20 docs)
│
├── apps/
│   ├── api/                          # Backend application (modular monolith)
│   │   ├── src/
│   │   │   ├── main.ts               # Application entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── modules/              # Business and platform modules
│   │   │   ├── shared/               # Cross-cutting shared code
│   │   │   └── config/               # Application configuration
│   │   ├── prisma/                   # Database schema and migrations
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/                     # Integration and e2e tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Frontend application (React SPA)
│       ├── src/
│       │   ├── main.tsx              # Application entry point
│       │   ├── app/                  # App shell, routing, providers
│       │   ├── features/             # Feature modules (mirror backend)
│       │   ├── shared/               # Shared components, hooks, utils
│       │   └── styles/               # Global styles, Tailwind config
│       ├── public/                   # Static assets
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                         # Shared packages (monorepo)
│   ├── shared-types/                 # Shared TypeScript types and enums
│   │   ├── src/
│   │   │   ├── domain/               # Domain enums, value object types
│   │   │   ├── api/                  # API request/response types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared-utils/                 # Shared utility functions
│       ├── src/
│       │   ├── money.ts
│       │   ├── date.ts
│       │   └── index.ts
│       └── package.json
│
├── infrastructure/                   # Infrastructure as code
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── docker-compose.yml        # Local development
│   └── scripts/
│       ├── setup-dev.sh
│       └── backup-db.sh
│
├── .env.example                      # Environment variable template
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── package.json                      # Root workspace package.json
├── pnpm-workspace.yaml               # Monorepo workspace config
├── tsconfig.base.json                # Shared TypeScript config
└── README.md                         # Project overview and setup instructions
```

---

## Backend Module Structure

Every module in `apps/api/src/modules/` follows this exact structure:

```
modules/
└── {module-name}/
    ├── domain/
    │   ├── entities/
    │   │   └── {entity}.entity.ts
    │   ├── value-objects/
    │   │   └── {name}.vo.ts
    │   ├── events/
    │   │   └── {event-name}.event.ts
    │   ├── repositories/
    │   │   └── {entity}.repository.ts          # Interface only
    │   ├── services/
    │   │   └── {name}-domain.service.ts        # Domain services (pure logic)
    │   └── errors/
    │       └── {module}.errors.ts
    │
    ├── application/
    │   ├── commands/
    │   │   └── {action}-{entity}.command.ts
    │   ├── queries/
    │   │   └── {action}-{entity}.query.ts
    │   ├── dtos/
    │   │   └── {entity}.dto.ts
    │   ├── services/
    │   │   └── {entity}.service.ts             # Application service
    │   └── mappers/
    │       └── {entity}.mapper.ts                # Entity ↔ DTO
    │
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── {entity}.repository.impl.ts     # ORM implementation
    │   │   └── {entity}.persistence-mapper.ts   # Entity ↔ DB record
    │   └── handlers/
    │       └── {event-name}.handler.ts           # Domain event handlers
    │
    ├── presentation/
    │   ├── {entity}.controller.ts
    │   ├── requests/
    │   │   └── {action}-{entity}.request.ts
    │   └── responses/
    │       └── {entity}.response.ts
    │
    ├── __tests__/
    │   ├── domain/
    │   │   └── {entity}.entity.spec.ts
    │   ├── application/
    │   │   └── {entity}.service.spec.ts
    │   └── integration/
    │       └── {entity}.controller.spec.ts
    │
    ├── {module-name}.module.ts                 # NestJS module definition
    └── index.ts                                # Public exports ONLY
```

### Module Index (`index.ts`) Exports

```typescript
// Only these are exported from a module:
export { LeadService } from './application/services/lead.service';
export { CreateLeadCommand } from './application/commands/create-lead.command';
export { LeadDto } from './application/dtos/lead.dto';
export { LeadSearchQuery } from './application/queries/search-leads.query';

// NEVER exported:
// - Lead entity
// - LeadRepository (interface or implementation)
// - LeadController
// - Internal mappers
```

---

## Backend Shared Structure

```
apps/api/src/shared/
├── auth/
│   ├── tenant-context.ts             # TenantContext type and middleware
│   ├── permissions.ts                # Permission definitions and checker
│   ├── decorators/
│   │   ├── require-permission.decorator.ts
│   │   └── tenant-context.decorator.ts
│   └── guards/
│       ├── auth.guard.ts
│       └── permission.guard.ts
│
├── events/
│   ├── domain-event.base.ts          # Base domain event class
│   ├── event-bus.ts                  # In-process event bus
│   └── event-handler.decorator.ts
│
├── database/
│   ├── prisma.service.ts             # Prisma client wrapper
│   ├── base.repository.ts            # Base repository with tenant scoping
│   └── transaction.decorator.ts
│
├── errors/
│   ├── domain.error.ts
│   ├── application.error.ts
│   ├── http-exception.filter.ts
│   └── error-codes.ts
│
├── value-objects/
│   ├── money.vo.ts
│   ├── date-range.vo.ts
│   ├── phone-number.vo.ts
│   ├── email.vo.ts
│   └── address.vo.ts
│
├── pagination/
│   ├── paginated-result.ts
│   └── cursor-pagination.ts
│
├── validation/
│   └── zod-pipe.ts                   # Zod validation pipe for NestJS
│
└── utils/
    ├── logger.ts
    └── id-generator.ts
```

---

## Backend Config Structure

```
apps/api/src/config/
├── app.config.ts                     # Port, environment, CORS
├── database.config.ts                # Database connection
├── auth.config.ts                    # JWT secrets, expiry
├── redis.config.ts                   # Redis connection
├── storage.config.ts                 # S3/object storage
├── ai.config.ts                      # AI provider keys and defaults
└── index.ts                          # Config loader and validator
```

---

## Frontend Feature Structure

Each feature in `apps/web/src/features/` mirrors a backend module:

```
features/
└── leads/
    ├── components/
    │   ├── LeadPipeline.tsx           # Pipeline kanban view
    │   ├── LeadCard.tsx               # Card in pipeline column
    │   ├── LeadDetail.tsx             # Lead detail panel/page
    │   ├── LeadForm.tsx               # Create/edit lead form
    │   ├── LeadStageSelect.tsx        # Stage transition dropdown
    │   └── LeadFilters.tsx            # Filter controls
    │
    ├── hooks/
    │   ├── useLeads.ts                # TanStack Query: list leads
    │   ├── useLead.ts                 # TanStack Query: single lead
    │   ├── useCreateLead.ts           # Mutation: create lead
    │   ├── useUpdateLeadStage.ts      # Mutation: stage transition
    │   └── useLeadPipeline.ts         # Pipeline-specific data
    │
    ├── api/
    │   └── leads.api.ts               # API client functions
    │
    ├── types/
    │   └── lead.types.ts              # Feature-specific types (if not in shared-types)
    │
    ├── pages/
    │   ├── LeadsPage.tsx              # Route: /leads
    │   └── LeadDetailPage.tsx         # Route: /leads/:id
    │
    └── index.ts                       # Public exports for routing
```

---

## Frontend Shared Structure

```
apps/web/src/shared/
├── components/                        # Design system components
│   ├── ui/                            # Primitives (Button, Input, Dialog, etc.)
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageContainer.tsx
│   ├── data-display/
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSkeleton.tsx
│   └── feedback/
│       ├── Toast.tsx
│       └── ConfirmDialog.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTenant.ts
│   └── useDebounce.ts
│
├── api/
│   ├── client.ts                      # Axios/fetch client with auth
│   └── query-client.ts               # TanStack Query client config
│
├── utils/
│   ├── format-money.ts
│   ├── format-date.ts
│   └── cn.ts                          # Tailwind class merge utility
│
└── types/
    └── common.types.ts
```

---

## Frontend App Structure

```
apps/web/src/app/
├── App.tsx                            # Root component
├── router.tsx                         # Route definitions
├── providers/
│   ├── AuthProvider.tsx
│   ├── QueryProvider.tsx
│   └── ThemeProvider.tsx
└── routes/
    ├── ProtectedRoute.tsx
    └── PublicRoute.tsx
```

---

## Test Structure

### Backend Tests

```
apps/api/
├── src/modules/lead/__tests__/        # Unit tests (colocated)
│   ├── domain/
│   │   └── lead.entity.spec.ts
│   └── application/
│       └── lead.service.spec.ts
│
└── test/                              # Integration and e2e tests
    ├── setup/
    │   ├── test-database.ts           # Test DB setup/teardown
    │   ├── test-factory.ts            # Entity factories for tests
    │   └── test-client.ts             # HTTP test client
    ├── integration/
    │   ├── lead.controller.spec.ts
    │   ├── quotation.controller.spec.ts
    │   └── booking-flow.spec.ts      # Cross-module flow test
    └── e2e/
        └── lead-to-booking.e2e.spec.ts
```

### Frontend Tests

```
apps/web/src/
├── features/leads/components/
│   └── __tests__/
│       ├── LeadPipeline.test.tsx
│       └── LeadForm.test.tsx
│
└── shared/components/ui/
    └── __tests__/
        └── Button.test.tsx
```

---

## Database Structure

```
apps/api/prisma/
├── schema.prisma                      # Full database schema
├── migrations/
│   ├── 20260706120000_create_tenants/
│   │   └── migration.sql
│   ├── 20260706120100_create_auth/
│   │   └── migration.sql
│   └── ...
└── seed.ts                            # Development seed data
```

---

## Naming Conventions for Files

| File Type | Pattern | Example |
|-----------|---------|---------|
| Entity | `{name}.entity.ts` | `lead.entity.ts` |
| Value Object | `{name}.vo.ts` | `money.vo.ts` |
| Domain Event | `{name}.event.ts` | `lead-created.event.ts` |
| Repository Interface | `{entity}.repository.ts` | `lead.repository.ts` |
| Repository Impl | `{entity}.repository.impl.ts` | `lead.repository.impl.ts` |
| Application Service | `{entity}.service.ts` | `lead.service.ts` |
| Command | `{action}-{entity}.command.ts` | `create-lead.command.ts` |
| Query | `{action}-{entity}.query.ts` | `search-leads.query.ts` |
| DTO | `{entity}.dto.ts` | `lead.dto.ts` |
| Controller | `{entity}.controller.ts` | `lead.controller.ts` |
| Request DTO | `{action}-{entity}.request.ts` | `create-lead.request.ts` |
| Response DTO | `{entity}.response.ts` | `lead.response.ts` |
| Event Handler | `{event-name}.handler.ts` | `quotation-approved.handler.ts` |
| Mapper | `{entity}.mapper.ts` | `lead.mapper.ts` |
| Module | `{name}.module.ts` | `lead.module.ts` |
| React Component | `{Name}.tsx` | `LeadPipeline.tsx` |
| React Hook | `use{Name}.ts` | `useLeads.ts` |
| Test | `{name}.spec.ts` / `{Name}.test.tsx` | `lead.entity.spec.ts` |

---

## Path Aliases

### Backend (`apps/api/tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

### Frontend (`apps/web/tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@app/*": ["src/app/*"]
    }
  }
}
```

### Shared Packages

```json
{
  "compilerOptions": {
    "paths": {
      "@event-os/types": ["packages/shared-types/src"],
      "@event-os/utils": ["packages/shared-utils/src"]
    }
  }
}
```

---

## Monorepo Management

- **Package manager:** pnpm with workspaces
- **Build order:** shared packages → api → web
- **Shared dependencies:** hoisted to root where possible
- **Independent versioning:** not needed initially (single product)
- **Turborepo:** optional, add when build times warrant it

---

## What Does NOT Belong in This Repository

| Item | Where It Goes |
|------|---------------|
| Environment secrets | Environment variables / secret manager |
| Production database dumps | Secure backup storage |
| Customer-specific configs | Database (`tenant_settings`) |
| Generated build artifacts | `.gitignore` (dist/, .next/, etc.) |
| IDE-specific settings (except shared) | Personal IDE config (except `.vscode/extensions.json`) |
| Large binary assets | Object storage |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [06-module-design.md](./06-module-design.md) | Module boundaries |
| [08-coding-standards.md](./08-coding-standards.md) | Naming and layer rules |
| [15-testing-strategy.md](./15-testing-strategy.md) | Test organization |
| [16-deployment-strategy.md](./16-deployment-strategy.md) | Infrastructure folder |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
