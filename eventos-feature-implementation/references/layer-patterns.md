# Layer Patterns

These are the exact code patterns used in the Event OS codebase. Follow them precisely.
Do not introduce new patterns, abstractions, or conventions.

## Module Structure

Every module follows this directory layout:

```
modules/<module-name>/
├── <module-name>.module.ts          # NestJS module definition
├── application/
│   ├── dtos/
│   │   └── <entity>.dto.ts          # DTO type + mapper function
│   └── services/
│       ├── <entity>.application.service.ts       # Application service
│       └── <entity>.application.service.spec.ts  # Unit tests
├── domain/
│   └── repositories/
│       └── <entity>.repository.ts   # Abstract repository + record type
├── infrastructure/
│   └── persistence/
│       └── <entity>.repository.impl.ts  # Prisma repository implementation
└── presentation/
    ├── <entity>.controller.ts       # REST controller
    └── schemas/
        └── <entity>.schemas.ts      # Zod request schemas
```

## Module Definition

```typescript
import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { XxxController } from './presentation/xxx.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [XxxController],
})
export class XxxModule {}
```

Controllers import from ApplicationServicesModule. Repositories are provided in
ApplicationServicesModule, not in the feature module.

## Domain Layer — Repository Interface + Record Type

```typescript
export type XxxRecord = {
  id: string;
  tenantId: string;
  // ... all fields matching Prisma model
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateXxxData = {
  // ... creation fields (no id, no tenantId, no timestamps, no version)
};

export abstract class XxxRepository {
  abstract create(tenantId: string, data: CreateXxxData): Promise<XxxRecord>;
  abstract findById(tenantId: string, id: string): Promise<XxxRecord | null>;
  // ... other methods as needed
}
```

Key rules:
- Record type mirrors the Prisma model exactly
- Repository is an abstract class, not an interface
- All methods take `tenantId` as the first parameter
- Return domain record types, never Prisma types

## Infrastructure Layer — Repository Implementation

```typescript
import { Injectable } from '@nestjs/common';
import type { Xxx } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type { CreateXxxData, XxxRecord, XxxRepository } from '../../domain/repositories/xxx.repository';

@Injectable()
export class XxxRepositoryImpl
  extends TenantScopedRepository
  implements XxxRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(tenantId: string, data: CreateXxxData): Promise<XxxRecord> {
    const record = await this.prisma.xxx.create({
      data: {
        tenant: { connect: { id: tenantId } },
        // ... map fields
      },
    });
    return this.mapRecord(record);
  }

  async findById(tenantId: string, id: string): Promise<XxxRecord | null> {
    const record = await this.prisma.xxx.findFirst({
      where: { id, tenantId },
    });
    return record ? this.mapRecord(record) : null;
  }

  private mapRecord(record: Xxx): XxxRecord {
    return {
      id: record.id,
      tenantId: record.tenantId,
      // ... map all fields
      // Use this.toNumber() for Decimal fields
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version,
    };
  }
}
```

Key rules:
- Extends TenantScopedRepository
- All queries include `tenantId` in where clause
- Uses `findFirst` with `{ id, tenantId }` (not `findUnique`) for tenant scoping
- Private `mapRecord` converts Prisma types to domain record types
- Use `this.toNumber()` for Decimal fields
- Use `this.toConcurrentModification()` for optimistic concurrency errors

## Application Layer — Service

```typescript
import { Injectable } from '@nestjs/common';
import { failure, success, type Result } from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { XxxCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import { XxxRepository } from '../../domain/repositories/xxx.repository';
import { toXxxDto, type XxxDto } from '../dtos/xxx.dto';

@Injectable()
export class XxxApplicationService {
  constructor(
    private readonly xxxRepository: XxxRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createXxx(tenantId: string, input: CreateXxxInput): Promise<Result<XxxDto>> {
    // 1. Validate business rules
    if (/* validation fails */) {
      return failure('VALIDATION_ERROR', 'Reason');
    }

    // 2. Call repository
    const record = await this.xxxRepository.create(tenantId, { /* ... */ });

    // 3. Publish domain event
    this.eventPublisher.publish(new XxxCreatedEvent(tenantId, record));

    // 4. Return mapped DTO
    return success(toXxxDto(record));
  }
}
```

Key rules:
- Always return `Result<T>` — never throw for business errors
- Use `failure()` for validation/business errors, `success()` for happy path
- Publish domain events after successful mutations
- Map to DTOs before returning (never return raw records)
- Inject repository via constructor (abstract class, not implementation)

## Application Layer — DTO

```typescript
import type { XxxRecord } from '../../domain/repositories/xxx.repository';

export type XxxDto = {
  id: string;
  // ... public-facing fields only (no tenantId, no version)
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
};

export function toXxxDto(record: XxxRecord): XxxDto {
  return {
    id: record.id,
    // ... map fields
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
```

Key rules:
- DTOs use string for dates (ISO format)
- DTOs exclude tenantId and version (internal fields)
- Mapper is a plain function, not a class

## Presentation Layer — Controller

```typescript
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { XxxApplicationService } from '../application/services/xxx.application.service';
import { createXxxSchema, type CreateXxxBody } from './schemas/xxx.schemas';

@ApiTags('Xxx')
@ApiBearerAuth()
@Controller('xxx')
export class XxxController {
  constructor(private readonly xxxService: XxxApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an xxx' })
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createXxxSchema)) body: CreateXxxBody,
  ) {
    const result = await this.xxxService.createXxx(tenantId, { /* map body */ });
    return resultToResponse(result);
  }
}
```

Key rules:
- HTTP concern only — parse request, call service, return response
- No business logic in controllers
- Use `ZodValidationPipe` for all request bodies
- Use `@TenantId()` decorator (ADR-016 hardcoded tenant)
- Use `resultToResponse()` to convert Result to HTTP response
- Use `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation` for Swagger

## Presentation Layer — Zod Schemas

```typescript
import { z } from 'zod';

export const createXxxSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  // ... fields per docs/09-api-design.md
});

export type CreateXxxBody = z.infer<typeof createXxxSchema>;
```

Key rules:
- Schema fields must match `docs/09-api-design.md` exactly
- Export both the schema and the inferred type
- Use `.optional()` for optional fields, not `.nullable()`
- Use `.uuid()` for ID references

## Domain Events

```typescript
// In shared/events/sprint1-domain.events.ts
export class XxxCreatedEvent extends DomainEvent {
  readonly eventName = 'XxxCreated';

  constructor(
    readonly tenantId: string,
    readonly xxx: XxxRecord,
  ) {
    super();
  }
}
```

Key rules:
- All events extend DomainEvent base class
- All events are defined in `sprint1-domain.events.ts`
- Events are suggestion-only (ADR-017) — handlers queue suggestions, never auto-execute
- Event payload is the full domain record

## Wiring in ApplicationServicesModule

New repositories must be provided in `modules/application-services.module.ts`:

```typescript
{
  provide: XxxRepository,
  useClass: XxxRepositoryImpl,
}
```

New modules must be added to `app.module.ts` imports.
