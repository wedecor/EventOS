# Coding Standards

## Purpose of This Document

This document defines the coding standards for Event OS. Every engineer and AI agent writing code for this project must follow these standards. Consistency enables readability, reviewability, and maintainability over a 10-year horizon.

---

## Language and Runtime

| Setting | Value |
|---------|-------|
| Language | TypeScript 5.x |
| Strict mode | Enabled (`strict: true`) |
| Target | ES2022 |
| Module system | ES Modules |
| Node.js | LTS version only |

### TypeScript Rules

- **No `any`** — Use `unknown` and narrow, or define proper types. `any` requires a comment justification in PR.
- **No `@ts-ignore`** — Fix the type error. `@ts-expect-error` allowed with explanation comment.
- **Explicit return types** on all public functions and application service methods.
- **No non-null assertion (`!`)** — Use proper null checks or optional chaining.
- **Prefer `interface`** for object shapes; `type` for unions, intersections, and mapped types.
- **Use `const`** by default. `let` only when reassignment is necessary. Never `var`.

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (modules) | kebab-case | `lead.service.ts`, `create-lead.command.ts` |
| Files (React components) | PascalCase | `LeadPipeline.tsx`, `QuotationForm.tsx` |
| Classes | PascalCase | `LeadService`, `CreateLeadCommand` |
| Interfaces | PascalCase, no `I` prefix | `LeadService` (not `ILeadService` in TypeScript) |
| Types | PascalCase | `LeadStage`, `QuotationStatus` |
| Functions / methods | camelCase | `createLead()`, `updateStage()` |
| Variables | camelCase | `leadCount`, `isApproved` |
| Constants | UPPER_SNAKE_CASE | `MAX_LINE_ITEMS`, `DEFAULT_PAGE_SIZE` |
| Enums | PascalCase name, PascalCase members | `LeadStage.New`, `QuotationStatus.Draft` |
| Database columns | snake_case | `tenant_id`, `created_at` |
| API URLs | kebab-case, plural | `/api/v1/lead-stage-history` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| Domain events | PascalCase past tense | `LeadCreated`, `QuotationApproved` |
| CSS classes | Tailwind utilities (no custom unless necessary) | `flex items-center gap-2` |

---

## Project Structure Per Module

Each backend module follows this structure:

```
modules/
└── lead/
    ├── domain/
    │   ├── entities/
    │   │   └── lead.entity.ts
    │   ├── value-objects/
    │   │   └── lead-stage.vo.ts
    │   ├── events/
    │   │   └── lead-created.event.ts
    │   ├── repositories/
    │   │   └── lead.repository.ts        # Interface only
    │   └── services/
    │       └── lead-domain.service.ts    # Pure domain logic
    ├── application/
    │   ├── commands/
    │   │   └── create-lead.command.ts
    │   ├── queries/
    │   │   └── search-leads.query.ts
    │   ├── dtos/
    │   │   └── lead.dto.ts
    │   └── services/
    │       └── lead.service.ts           # Application service (use cases)
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── lead.repository.impl.ts   # ORM implementation
    │   │   └── lead.mapper.ts            # Entity ↔ DB model
    │   └── handlers/
    │       └── quotation-approved.handler.ts
    ├── presentation/
    │   ├── lead.controller.ts
    │   └── lead.validator.ts
    ├── lead.module.ts                    # Module registration
    └── index.ts                            # Public exports only
```

See [10-folder-structure.md](./10-folder-structure.md) for the complete tree.

---

## Layer Rules

### Domain Layer

```typescript
// ✅ Correct: Pure domain entity with business logic
export class Lead {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private _stage: LeadStage,
    // ...
  ) {}

  static create(props: CreateLeadProps): Lead {
    // Validation and creation logic
  }

  advanceStage(newStage: LeadStage): void {
    if (!this._stage.canTransitionTo(newStage)) {
      throw new DomainError('INVALID_STAGE_TRANSITION', 
        `Cannot transition from ${this._stage} to ${newStage}`);
    }
    this._stage = newStage;
  }

  get stage(): LeadStage {
    return this._stage;
  }
}
```

```typescript
// ❌ Incorrect: Domain entity with infrastructure concerns
export class Lead {
  @Column() id: string;          // ❌ ORM decorator in domain
  async save(): Promise<void> {} // ❌ Persistence in domain
}
```

**Rules:**
- No framework imports (NestJS, Prisma, Express)
- No I/O operations (database, HTTP, file system)
- Business invariants enforced in entity methods
- Immutable value objects (no setters)

### Application Layer

```typescript
// ✅ Correct: Application service orchestrates use case
export class LeadService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly eventBus: EventBus,
  ) {}

  async create(command: CreateLeadCommand, context: TenantContext): Promise<LeadDto> {
    const lead = Lead.create({
      tenantId: context.tenantId,
      source: command.source,
      eventType: command.eventType,
      // ...
    });

    await this.leadRepository.save(lead);
    await this.eventBus.publish(new LeadCreated(lead.id, context.tenantId));

    return LeadMapper.toDto(lead);
  }
}
```

**Rules:**
- One public method per use case
- Manages transaction boundaries
- Validates authorization (checks permissions from TenantContext)
- Maps domain entities to DTOs before returning
- Never exposes domain entities to presentation layer

### Infrastructure Layer

```typescript
// ✅ Correct: Repository implements domain interface
export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(lead: Lead): Promise<void> {
    const data = LeadMapper.toPersistence(lead);
    await this.prisma.lead.upsert({
      where: { id: lead.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Lead | null> {
    const record = await this.prisma.lead.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
    return record ? LeadMapper.toDomain(record) : null;
  }
}
```

**Rules:**
- Implements interfaces defined in domain layer
- Handles ORM mapping (separate mapper class)
- Always includes `tenant_id` in queries
- Never contains business logic

### Presentation Layer

```typescript
// ✅ Correct: Thin controller delegates to application service
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @RequirePermission('leads:write')
  async create(
    @Body() body: CreateLeadRequest,
    @TenantContext() context: TenantContext,
  ): Promise<LeadResponse> {
    const command = CreateLeadCommand.fromRequest(body);
    const result = await this.leadService.create(command, context);
    return LeadResponse.fromDto(result);
  }
}
```

**Rules:**
- No business logic in controllers
- Request validation via DTOs/validators (Zod or class-validator)
- Authorization decorators, not inline checks
- Response serialization only

---

## Error Handling

### Domain Errors

```typescript
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// Usage
throw new DomainError('QUOTATION_NOT_EDITABLE', 'Quotation cannot be edited after being sent.');
```

### Application Errors

```typescript
export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id ${id} not found.`);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(action: string) {
    super('FORBIDDEN', `You do not have permission to ${action}.`);
  }
}
```

### Error Handling Rules

- Domain layer throws `DomainError`
- Application layer throws `ApplicationError` (NotFound, Forbidden, Conflict)
- Presentation layer catches and maps to HTTP status codes
- Never catch errors silently (empty catch blocks)
- Always log unexpected errors with context (requestId, tenantId, userId)
- Never expose stack traces or internal details to API clients

---

## Validation

### Input Validation (API Boundary)

Use Zod schemas for request validation:

```typescript
export const CreateLeadSchema = z.object({
  source: z.enum(['instagram', 'website', 'whatsapp', 'referral', 'walk_in', 'phone', 'other']),
  eventType: z.string().min(1).max(100),
  eventDate: z.object({
    start: z.string().date(),
    end: z.string().date(),
  }).optional(),
  estimatedBudget: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
  }).optional(),
  notes: z.string().max(5000).optional(),
});
```

### Domain Validation (Business Rules)

Business rules are enforced in domain entities, not validators:

```typescript
// Domain entity enforces invariants
lead.advanceStage(LeadStage.Quoted);  // Throws if transition invalid

// NOT in a validator:
if (lead.stage === 'new' && newStage === 'quoted') { /* ❌ */ }
```

---

## Async Patterns

- Always use `async/await`. Never raw `.then()` chains.
- Never use `async` without `await` (no unnecessary async).
- Parallel independent operations use `Promise.all()`:

```typescript
const [client, staff] = await Promise.all([
  this.clientService.getById(clientId, context),
  this.staffService.getById(staffId, context),
]);
```

- Sequential dependent operations use await:

```typescript
const lead = await this.leadRepository.findById(id, tenantId);
lead.advanceStage(LeadStage.Qualified);
await this.leadRepository.save(lead);
```

---

## Logging

Use structured logging (pino):

```typescript
logger.info({ tenantId, leadId, stage: 'qualified' }, 'Lead stage advanced');
logger.error({ err, tenantId, requestId }, 'Failed to create quotation');
```

### Log Levels

| Level | Usage |
|-------|-------|
| `error` | Unexpected failures requiring attention |
| `warn` | Recoverable issues, deprecated usage |
| `info` | Business events (lead created, booking confirmed) |
| `debug` | Development diagnostics (not in production) |

### Never Log

- Passwords or tokens
- Full credit card numbers
- Personal data beyond IDs (log `clientId`, not client name, in production)

---

## Testing Standards

See [15-testing-strategy.md](./15-testing-strategy.md). Key coding standards for tests:

- Test files colocated: `lead.entity.spec.ts` next to `lead.entity.ts`
- Or in `__tests__/` directory within the module
- Descriptive test names: `'should reject stage transition from new to quoted'`
- Arrange-Act-Assert pattern
- No test logic in production code

---

## Git Conventions

### Branch Naming

```
feature/lead-pipeline-view
fix/quotation-total-calculation
chore/upgrade-dependencies
docs/api-standards-update
```

### Commit Messages

Follow Conventional Commits:

```
feat(lead): add pipeline stage transition validation
fix(quotation): correct tax calculation for inclusive pricing
docs: update module design for finance module
chore: upgrade prisma to 5.x
test(booking): add cancellation flow integration tests
refactor(crm): extract contact validation to domain service
```

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`

### Pull Request Standards

- One feature/fix per PR
- PR description includes: what, why, how to test
- All CI checks pass
- At least one approval required
- No merge without passing tests

---

## Code Formatting

Enforced by tooling (not manual):

| Tool | Purpose | Config |
|------|---------|--------|
| ESLint | Linting rules | `.eslintrc.js` |
| Prettier | Code formatting | `.prettierrc` |
| TypeScript Compiler | Type checking | `tsconfig.json` strict |

Pre-commit hooks run lint and format checks. CI runs full type check and tests.

### Prettier Defaults

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## Import Rules

- Use absolute imports with path aliases (`@modules/lead`, `@shared/`)
- No circular imports (enforced by ESLint plugin)
- Import order:
  1. External packages
  2. Internal modules (`@modules/`, `@shared/`)
  3. Relative imports (same module only)

```typescript
// ✅ Correct import order
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { EventBus } from '@shared/events';
import { TenantContext } from '@shared/auth';

import { Lead } from '../domain/entities/lead.entity';
import { LeadRepository } from '../domain/repositories/lead.repository';
```

---

## Comments and Documentation

### When to Comment

- **Non-obvious business rules** — "Quotation numbers reset annually per tenant configuration"
- **Workarounds** — "PostgreSQL does not support X, so we Y"
- **Complex algorithms** — Tax calculation, lead scoring

### When NOT to Comment

- Obvious code (`// increment counter`)
- Commented-out code (delete it; git has history)
- TODO without issue reference (use `// TODO(#123): description`)

### JSDoc

Public interfaces and application service methods:

```typescript
/**
 * Creates a new lead and optionally links to an existing client.
 * Emits LeadCreated domain event on success.
 * 
 * @throws {ForbiddenError} if user lacks leads:write permission
 * @throws {DomainError} if source is invalid for tenant configuration
 */
async create(command: CreateLeadCommand, context: TenantContext): Promise<LeadDto>
```

---

## Security Coding Rules

- Never concatenate user input into SQL (use ORM/parameterized queries)
- Never render unsanitized HTML from user input
- Never store secrets in source code (use environment variables)
- Never log authentication tokens or passwords
- Always validate and sanitize input at API boundary
- Always check authorization in application layer, not just controller
- Always scope database queries by `tenant_id`

See [14-security-principles.md](./14-security-principles.md).

---

## Frontend Standards

### React Conventions

- Functional components only (no class components)
- Custom hooks for reusable logic (`useLeads()`, `useQuotation()`)
- Server state via TanStack Query; UI state via Zustand or local state
- No prop drilling beyond 2 levels (use context or composition)
- Component files export one primary component

### Component Structure

```typescript
// LeadPipeline.tsx
interface LeadPipelineProps {
  onLeadSelect: (leadId: string) => void;
}

export function LeadPipeline({ onLeadSelect }: LeadPipelineProps) {
  const { data: leads, isLoading } = useLeads();

  if (isLoading) return <PipelineSkeleton />;

  return (
    <div className="flex gap-4 overflow-x-auto">
      {PIPELINE_STAGES.map((stage) => (
        <PipelineColumn key={stage} stage={stage} leads={leads[stage]} onSelect={onLeadSelect} />
      ))}
    </div>
  );
}
```

### State Management Rules

| State Type | Tool | Example |
|------------|------|---------|
| Server data | TanStack Query | Leads list, quotation details |
| URL state | React Router search params | Filters, pagination, active tab |
| UI state | useState / Zustand | Modal open, sidebar collapsed |
| Form state | React Hook Form | Quotation form, lead creation |

---

## Performance Coding Rules

- No database queries inside loops (N+1 problem)
- Paginate all list endpoints (default: 20 items)
- Lazy load frontend routes and heavy components
- Debounce search inputs (300ms)
- Optimistic updates for status changes (with rollback on failure)

---

## Related Documents

| Document | Topic |
|----------|-------|
| [03-product-principles.md](./03-product-principles.md) | Principles governing standards |
| [10-folder-structure.md](./10-folder-structure.md) | Directory layout |
| [15-testing-strategy.md](./15-testing-strategy.md) | Testing standards |
| [18-api-standards.md](./18-api-standards.md) | API conventions |
| [19-development-workflow.md](./19-development-workflow.md) | Development process |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
