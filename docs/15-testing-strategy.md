# Testing Strategy

## Purpose of This Document

This document defines the testing philosophy, types, tools, coverage targets, and practices for Event OS. Tests are a production-readiness requirement, not a nice-to-have. Code without tests is incomplete.

---

## Testing Philosophy

### Tests Enable Confidence, Not Coverage Theater

We write tests to gain confidence that the system works correctly, not to hit arbitrary coverage numbers. However, coverage targets exist to prevent untested code from accumulating.

### Test the Right Thing at the Right Level

```
         ╱╲
        ╱  ╲         E2E Tests (few, critical journeys)
       ╱────╲
      ╱      ╲       Integration Tests (API endpoints, cross-module flows)
     ╱────────╲
    ╱          ╲     Unit Tests (domain logic, application services)
   ╱────────────╲
```

- **Unit tests** are fast, numerous, and test business logic in isolation
- **Integration tests** verify API endpoints and database interactions
- **E2E tests** verify critical user journeys end-to-end

### Tests Are Documentation

A well-named test describes expected behavior: `'should reject stage transition from new to quoted directly'`. Tests are the executable specification of business rules.

---

## Test Types

### Unit Tests

**What:** Domain entities, value objects, domain services, application services (with mocked dependencies).

**Speed:** < 100ms per test.

**Location:** Colocated with source: `lead.entity.spec.ts` next to `lead.entity.ts`.

**Example — Domain Entity:**

```typescript
describe('Lead', () => {
  describe('advanceStage', () => {
    it('should allow transition from new to contacted', () => {
      const lead = LeadFactory.create({ stage: LeadStage.New });
      lead.advanceStage(LeadStage.Contacted);
      expect(lead.stage).toBe(LeadStage.Contacted);
    });

    it('should reject transition from new to quoted', () => {
      const lead = LeadFactory.create({ stage: LeadStage.New });
      expect(() => lead.advanceStage(LeadStage.Quoted))
        .toThrow(DomainError);
    });

    it('should require lostReason when transitioning to lost', () => {
      const lead = LeadFactory.create({ stage: LeadStage.Contacted });
      expect(() => lead.advanceStage(LeadStage.Lost))
        .toThrow(DomainError);
    });
  });
});
```

**Example — Application Service:**

```typescript
describe('LeadService', () => {
  let service: LeadService;
  let mockRepository: jest.Mocked<LeadRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockRepository = createMockLeadRepository();
    mockEventBus = createMockEventBus();
    service = new LeadService(mockRepository, mockEventBus);
  });

  it('should create lead and emit LeadCreated event', async () => {
    const command = new CreateLeadCommand({ source: 'instagram', eventType: 'Wedding' });
    const context = TenantContextFactory.create();

    const result = await service.create(command, context);

    expect(result.source).toBe('instagram');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'lead.created' }),
    );
  });
});
```

**Rules:**
- Mock all external dependencies (repositories, event bus, external services)
- Test business rules and edge cases, not framework behavior
- One assertion focus per test (multiple `expect` calls OK if testing one behavior)
- Use factories for test data, not manual object construction

---

### Integration Tests

**What:** API endpoints with real database (test database), testing the full request → response cycle including persistence.

**Speed:** < 2s per test.

**Location:** `apps/api/test/integration/`.

**Example:**

```typescript
describe('POST /api/v1/leads', () => {
  it('should create a lead and return 201', async () => {
    const response = await testClient
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${salesUserToken}`)
      .send({
        source: 'website',
        eventType: 'Corporate Event',
        estimatedBudget: { amount: 500000, currency: 'INR' },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.source).toBe('website');
    expect(response.body.data.stage).toBe('new');

    // Verify persistence
    const lead = await testDb.lead.findFirst({
      where: { id: response.body.data.id },
    });
    expect(lead).not.toBeNull();
    expect(lead.tenant_id).toBe(testTenant.id);
  });

  it('should return 403 without leads:write permission', async () => {
    const response = await testClient
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ source: 'website', eventType: 'Wedding' });

    expect(response.status).toBe(403);
  });

  it('should not access leads from another tenant', async () => {
    const otherTenantLead = await LeadFactory.createInDb({ tenantId: otherTenant.id });

    const response = await testClient
      .get(`/api/v1/leads/${otherTenantLead.id}`)
      .set('Authorization', `Bearer ${salesUserToken}`);

    expect(response.status).toBe(404);
  });
});
```

**Rules:**
- Use a dedicated test database (reset between test suites)
- Test authentication, authorization, and tenant isolation on every endpoint
- Test happy path and primary error cases (validation, not found, forbidden, conflict)
- Use test factories for seeding data
- Clean up test data after each suite

---

### End-to-End Tests

**What:** Critical business journeys spanning multiple modules, tested through the API (and optionally the UI).

**Speed:** < 10s per test.

**Location:** `apps/api/test/e2e/`.

**Critical Journeys:**

| Journey | Steps Tested |
|---------|-------------|
| **Lead to Booking** | Create lead → advance stages → create quotation → add line items → send → approve → verify booking created → verify calendar entry → verify tasks generated |
| **Booking to Invoice** | Create booking → generate invoice → record payment → verify invoice status |
| **Tenant Isolation** | Create data in tenant A → verify tenant B cannot access |
| **Auth Flow** | Login → access resource → token expiry → refresh → access resource → logout → verify denied |

**Example:**

```typescript
describe('Lead to Booking flow', () => {
  it('should complete the full sales pipeline', async () => {
    // 1. Create lead
    const leadRes = await api.post('/leads').send(leadData);
    const leadId = leadRes.body.data.id;

    // 2. Advance through pipeline
    await api.patch(`/leads/${leadId}/stage`).send({ stage: 'qualified' });

    // 3. Create quotation
    const quoteRes = await api.post('/quotations').send({
      leadId,
      clientId: leadRes.body.data.clientId,
      eventType: 'Wedding',
      eventDate: { start: '2026-12-15', end: '2026-12-15' },
    });
    const quoteId = quoteRes.body.data.id;

    // 4. Add line items and send
    await api.post(`/quotations/${quoteId}/line-items`).send(lineItemData);
    await api.post(`/quotations/${quoteId}/send`);

    // 5. Approve quotation
    await api.post(`/quotations/${quoteId}/approve`);

    // 6. Verify booking created
    const bookings = await api.get('/bookings').query({ quotationId: quoteId });
    expect(bookings.body.data).toHaveLength(1);
    expect(bookings.body.data[0].status).toBe('confirmed');

    // 7. Verify calendar entry
    const calendar = await api.get('/calendar').query({
      start: '2026-12-01',
      end: '2026-12-31',
    });
    expect(calendar.body.data.some(e => e.bookingId === bookings.body.data[0].id)).toBe(true);
  });
});
```

---

### Frontend Tests

**Component Tests (React Testing Library):**

```typescript
describe('LeadPipeline', () => {
  it('should render all pipeline stages', () => {
    render(<LeadPipeline leads={mockLeads} onLeadSelect={jest.fn()} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
  });

  it('should call onLeadSelect when a lead card is clicked', async () => {
    const onSelect = jest.fn();
    render(<LeadPipeline leads={mockLeads} onLeadSelect={onSelect} />);
    await userEvent.click(screen.getByText('Rajesh Wedding'));
    expect(onSelect).toHaveBeenCalledWith('lead-123');
  });
});
```

**Frontend test focus:**
- User interactions (click, type, select)
- Conditional rendering (loading, empty, error states)
- Form validation messages
- Not testing implementation details (state variables, internal methods)

---

## Coverage Targets

| Layer | Target | Measured By |
|-------|--------|-------------|
| **Domain entities & value objects** | 90%+ line coverage | Unit tests |
| **Application services** | 80%+ line coverage | Unit tests |
| **API endpoints (integration)** | 100% of endpoints have at least one test | Integration tests |
| **Critical user journeys** | 100% of defined journeys | E2E tests |
| **Frontend components (interactive)** | 70%+ line coverage | Component tests |
| **Overall** | 75%+ line coverage | All tests combined |

Coverage is measured in CI. PRs that decrease coverage below targets require justification.

---

## Test Infrastructure

### Tools

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertion library (backend and frontend) |
| **React Testing Library** | Frontend component testing |
| **Supertest** | HTTP integration testing |
| **Testcontainers** (or Docker Compose) | Test database provisioning |
| **Fishery / custom factories** | Test data generation |

### Test Database

- Separate PostgreSQL database for tests (`event_os_test`)
- Migrations run before test suite
- Database reset between test suites (truncate all tables)
- Seed data: default tenant, test users with various roles

### Test Factories

```typescript
// test/factories/lead.factory.ts
export const LeadFactory = {
  build(overrides?: Partial<LeadProps>): Lead {
    return Lead.create({
      tenantId: TEST_TENANT_ID,
      source: 'website',
      eventType: 'Wedding',
      ...overrides,
    });
  },

  async createInDb(overrides?: Partial<LeadProps>): Promise<LeadRecord> {
    const lead = this.build(overrides);
    return testDb.lead.create({ data: LeadMapper.toPersistence(lead) });
  },
};
```

### CI Pipeline

```yaml
# Every PR runs:
1. Lint (ESLint)
2. Type check (tsc --noEmit)
3. Unit tests (jest --testPathPattern=spec.ts)
4. Integration tests (jest --testPathPattern=integration --runInBand)
5. Build (verify compilation)
6. Coverage report (upload to CI)
```

E2E tests run on merge to main (not on every PR, due to speed).

---

## What to Test

### Always Test

- Domain business rules and invariants
- State transitions (lead stages, quotation status, booking status)
- Authorization (permission denied scenarios)
- Tenant isolation (cross-tenant access denied)
- Input validation (invalid data rejected)
- Financial calculations (quotation totals, tax, invoice amounts)
- Error cases (not found, conflict, forbidden)

### Do Not Test

- Framework behavior (NestJS routing, Prisma query generation)
- Third-party library internals
- Simple getters/setters with no logic
- Configuration loading
- Generated code (ORM client, OpenAPI types)

### Test Naming Convention

```
should {expected behavior} when {condition}

Examples:
- should create lead with new stage when valid data provided
- should reject quotation edit when status is sent
- should return 404 when lead belongs to different tenant
- should calculate total as subtotal minus discount plus tax
```

---

## Test Data Management

### Principles

1. **Factories over fixtures** — Generate test data programmatically, not from static JSON files
2. **Minimal data** — Create only the data needed for the specific test
3. **Isolated tests** — No test depends on another test's data
4. **Realistic data** — Use domain-appropriate values (Indian names, INR currency, wedding event types)
5. **Tenant-scoped** — All test data belongs to a test tenant

### Test Users

| User | Role | Purpose |
|------|------|---------|
| `owner@test.com` | owner | Full access tests |
| `sales@test.com` | sales | Sales workflow tests |
| `sales-manager@test.com` | sales_manager | Team visibility tests |
| `operations@test.com` | operations_manager | Operations workflow tests |
| `finance@test.com` | finance | Financial data tests |
| `viewer@test.com` | viewer | Read-only access tests |
| `other-tenant@test.com` | sales (different tenant) | Tenant isolation tests |

---

## Performance Testing (Phase 2+)

| Test | Target | Tool |
|------|--------|------|
| API response time (p95) | < 200ms for reads, < 500ms for writes | k6 or Artillery |
| Concurrent users | 100 simultaneous users without degradation | Load test |
| Database query time | < 50ms for list queries | EXPLAIN ANALYZE in integration tests |
| Page load time | < 3s for initial load, < 1s for navigation | Lighthouse CI |

---

## Regression Prevention

- **Bug fix = test** — Every bug fix includes a test that would have caught the bug
- **Flaky test policy** — Flaky tests are fixed or removed within 48 hours; no retries as permanent solution
- **Test review** — Test quality reviewed in PR review alongside production code
- **Broken test = blocked merge** — CI must pass for merge

---

## Related Documents

| Document | Topic |
|----------|-------|
| [08-coding-standards.md](./08-coding-standards.md) | Code standards including test conventions |
| [10-folder-structure.md](./10-folder-structure.md) | Test file locations |
| [14-security-principles.md](./14-security-principles.md) | Security testing requirements |
| [20-definition-of-done.md](./20-definition-of-done.md) | Testing in DoD |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
