# Testing Patterns

Follow these exact testing conventions. Do not introduce test frameworks, assertion libraries,
or patterns not already in the codebase.

## Stack

- Jest 30 with @swc/jest transform
- Tests co-located with source files: `xxx.spec.ts` next to `xxx.ts`
- E2E tests in `test/` directory: `xxx.e2e-spec.ts`

## Application Service Unit Tests

```typescript
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { XxxCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import { XxxApplicationService } from './xxx.application.service';
import type { XxxRecord, XxxRepository } from '../../domain/repositories/xxx.repository';

describe('XxxApplicationService', () => {
  const tenantId = 'tenant-1';

  // Base record for reuse across tests
  const baseRecord: XxxRecord = {
    id: 'xxx-1',
    tenantId,
    // ... all fields with realistic defaults
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let repository: jest.Mocked<XxxRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: XxxApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      // ... mock all abstract methods
    };
    eventPublisher = { publish };
    service = new XxxApplicationService(repository, eventPublisher);
  });

  // Happy path
  it('creates xxx and publishes event', async () => {
    repository.create.mockResolvedValue(baseRecord);

    const result = await service.createXxx(tenantId, { /* valid input */ });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('xxx-1');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(XxxCreatedEvent));
  });

  // Validation error paths
  it('rejects invalid input', async () => {
    const result = await service.createXxx(tenantId, { /* invalid input */ });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  // Verify repository receives correct arguments
  it('passes all fields to repository', async () => {
    repository.create.mockResolvedValue(baseRecord);
    await service.createXxx(tenantId, { /* full input */ });
    expect(repository.create).toHaveBeenCalledWith(tenantId, { /* expected data */ });
  });

  // Empty result sets
  it('returns empty array when no records exist', async () => {
    repository.findByXxx.mockResolvedValue([]);
    const result = await service.listXxx(tenantId);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });
});
```

## Key Testing Rules

1. **Mock repositories as objects** — create `jest.Mocked<XxxRepository>` objects with all
   abstract methods as `jest.fn()`. Do not use `jest.mock()` on the module.

2. **Mock DomainEventPublisher** — create `{ publish: jest.fn() }`.

3. **Instantiate service directly** — do not use NestJS TestingModule for unit tests.
   `new XxxApplicationService(repository, eventPublisher)`.

4. **Test Result<T> pattern** — always check `result.ok` before accessing `result.value`
   or `result.error`. Use type narrowing: `if (result.ok) { expect(result.value...) }`.

5. **Required test cases for every service method:**
   - Happy path (valid input → success result + correct return value)
   - Validation errors (invalid input → failure result with correct error code)
   - Event publication (correct event type published after mutation)
   - Repository argument verification (correct data passed to repository)
   - Empty/null results (method handles missing data gracefully)

6. **Use `beforeEach`** to reset all mocks and create fresh service instance.

7. **Base record pattern** — define a `baseRecord` const with all fields populated. Spread
   it with overrides for specific test cases: `{ ...baseRecord, id: 'xxx-2', amount: 3000 }`.

8. **Do not test controllers** in unit tests. Controller logic is tested via e2e tests.

9. **Do not test repository implementations** in unit tests. They are tested via integration/e2e.

## What NOT to Do

- Do not use `jest.spyOn` on repository methods — use the mocked object directly
- Do not use `TestingModule` for service unit tests
- Do not import `@nestjs/testing` in unit tests
- Do not write snapshot tests
- Do not test private methods
- Do not add test utilities or helpers not already in the codebase
