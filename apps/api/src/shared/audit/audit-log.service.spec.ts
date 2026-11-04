import { Logger } from '@nestjs/common';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditEntry,
} from './audit-log.entry';
import type { AuditLogRepository } from './audit-log.repository';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const entry: AuditEntry = {
    actorId: 'user-1',
    tenantId: 'tenant-1',
    action: AUDIT_ACTIONS.QUOTATION_APPROVED,
    entityType: AUDIT_ENTITY_TYPES.QUOTATION,
    entityId: 'quotation-1',
    outcome: 'success',
    metadata: { status: 'approved' },
  };

  let record: jest.Mock;
  let repository: jest.Mocked<AuditLogRepository>;
  let service: AuditLogService;

  beforeEach(() => {
    record = jest.fn().mockResolvedValue(undefined);
    repository = { record };
    service = new AuditLogService(repository);
  });

  it('delegates the entry to the repository', async () => {
    await service.record(entry);

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(entry);
  });

  it('swallows repository errors so the business operation is never affected', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    record.mockRejectedValue(new Error('db down'));

    await expect(service.record(entry)).resolves.toBeUndefined();
    expect(loggerError).toHaveBeenCalled();

    loggerError.mockRestore();
  });
});
