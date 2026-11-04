import type { PrismaService } from '../../database/prisma.service';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from './audit-log.entry';
import { PrismaAuditLogRepository } from './audit-log.repository.impl';

describe('PrismaAuditLogRepository', () => {
  let create: jest.Mock;
  let prisma: PrismaService;
  let repository: PrismaAuditLogRepository;

  beforeEach(() => {
    create = jest.fn().mockResolvedValue({ id: 'audit-1' });
    prisma = { auditLog: { create } } as unknown as PrismaService;
    repository = new PrismaAuditLogRepository(prisma);
  });

  it('persists an audit entry, connecting the tenant and storing metadata', async () => {
    await repository.record({
      actorId: 'user-1',
      tenantId: 'tenant-1',
      action: AUDIT_ACTIONS.PAYMENT_RECORDED,
      entityType: AUDIT_ENTITY_TYPES.PAYMENT,
      entityId: 'payment-1',
      outcome: 'success',
      metadata: { amount: 5000, invoiceId: 'invoice-1' },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenant: { connect: { id: 'tenant-1' } },
        actorId: 'user-1',
        action: AUDIT_ACTIONS.PAYMENT_RECORDED,
        entityType: AUDIT_ENTITY_TYPES.PAYMENT,
        entityId: 'payment-1',
        outcome: 'success',
        metadata: { amount: 5000, invoiceId: 'invoice-1' },
      },
    });
  });

  it('omits metadata when it is null or undefined', async () => {
    await repository.record({
      actorId: 'user-1',
      tenantId: 'tenant-1',
      action: AUDIT_ACTIONS.VENDOR_EXPENSE_CREATED,
      entityType: AUDIT_ENTITY_TYPES.VENDOR_EXPENSE,
      entityId: '',
      outcome: 'failure',
      metadata: null,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityId: '',
        outcome: 'failure',
        metadata: undefined,
      }),
    });
  });
});
