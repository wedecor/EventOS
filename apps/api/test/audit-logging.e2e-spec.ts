import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { BookingApplicationService } from '../src/modules/booking/application/services/booking.application.service';
import { QuotationRepository } from '../src/modules/quotation/domain/repositories/quotation.repository';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { AuditLogRepository } from '../src/shared/audit';
import { DomainEventPublisher } from '../src/shared/events/domain-event.base';
import { failure } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const ACTOR_ID = '11111111-1111-1111-1111-111111111111';
const QUOTATION_ID = '22222222-2222-2222-2222-222222222222';

/**
 * R1-08 — verifies structured audit logging end-to-end through the HTTP layer for a
 * representative sensitive operation (quotation approval):
 * - the authenticated actor's id flows from the JWT through the controller into the
 *   application service and onto the emitted audit record;
 * - a success outcome is recorded when approval succeeds;
 * - a failure outcome is recorded when approval is rejected.
 *
 * Business repositories and the domain-event bus are stubbed; the AuditLogRepository
 * is replaced with a spy so no real database is required.
 */
describe('Audit logging (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const auditRecord = jest.fn().mockResolvedValue(undefined);
  const findById = jest.fn();
  const update = jest.fn();

  const sentQuotation = {
    id: QUOTATION_ID,
    tenantId: TENANT_ID,
    customerId: 'customer-1',
    leadId: null,
    quotationNumber: 1001,
    revisionNumber: 1,
    status: 'sent',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venue: 'Bangalore',
    validUntil: null,
    terms: null,
    notes: null,
    subtotalAmount: 100000,
    discountAmount: 0,
    taxAmount: 18000,
    totalAmount: 118000,
    currency: 'INR',
    supersededById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const bearer = (): string =>
    `Bearer ${tokenService.signAccessToken({
      userId: ACTOR_ID,
      tenantId: TENANT_ID,
      email: 'admin@wedecor.test',
      role: 'admin',
    })}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        status: 'ready',
        quit: jest.fn().mockResolvedValue('OK'),
        connect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(QuotationRepository)
      .useValue({ findById, update })
      .overrideProvider(BookingApplicationService)
      .useValue({
        createEventFromApprovedQuotation: jest
          .fn()
          .mockResolvedValue(failure('EP1-BR-001', 'Advance not confirmed.')),
      })
      .overrideProvider(DomainEventPublisher)
      .useValue({ publish: jest.fn() })
      .overrideProvider(AuditLogRepository)
      .useValue({ record: auditRecord })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  afterEach(() => {
    auditRecord.mockClear();
    findById.mockReset();
    update.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('records a success audit entry with the actor id from the JWT on approval', async () => {
    findById.mockResolvedValue(sentQuotation);
    update.mockResolvedValue({
      ...sentQuotation,
      status: 'approved',
      version: 2,
    });

    await request(app.getHttpServer())
      .post(`/api/v1/quotations/${QUOTATION_ID}/approve`)
      .set('Authorization', bearer())
      .set('If-Match', '1')
      .expect(201);

    expect(auditRecord).toHaveBeenCalledTimes(1);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        tenantId: TENANT_ID,
        action: 'quotation.approved',
        entityType: 'Quotation',
        entityId: QUOTATION_ID,
        outcome: 'success',
      }),
    );
  });

  it('records a failure audit entry when approval is rejected', async () => {
    findById.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post(`/api/v1/quotations/${QUOTATION_ID}/approve`)
      .set('Authorization', bearer())
      .set('If-Match', '1')
      .expect(404);

    expect(auditRecord).toHaveBeenCalledTimes(1);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        action: 'quotation.approved',
        entityId: QUOTATION_ID,
        outcome: 'failure',
        metadata: { errorCode: 'NOT_FOUND' },
      }),
    );
  });
});
