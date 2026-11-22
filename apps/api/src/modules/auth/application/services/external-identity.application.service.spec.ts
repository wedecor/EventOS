import type { AuditLogService } from '../../../../shared/audit';
import type {
  ExternalIdentityRecord,
  ExternalIdentityRepository,
} from '../../domain/repositories/external-identity.repository';
import type {
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { ExternalIdentityApplicationService } from './external-identity.application.service';

describe('ExternalIdentityApplicationService (M5-01)', () => {
  const tenantId = 'tenant-1';
  const actor = 'owner-1';

  const user = { id: 'user-1', tenantId } as UserRecord;
  const record: ExternalIdentityRecord = {
    id: 'ident-1',
    tenantId,
    userId: user.id,
    provider: 'firebase',
    subject: 'uid-1',
    email: 'ops@example.test',
    linkedAt: new Date('2026-11-23T00:00:00Z'),
    linkedByUserId: actor,
    lastUsedAt: null,
    createdAt: new Date('2026-11-23T00:00:00Z'),
  };

  let identities: jest.Mocked<ExternalIdentityRepository>;
  let users: jest.Mocked<UserRepository>;
  let audit: jest.Mocked<Pick<AuditLogService, 'record'>>;
  let service: ExternalIdentityApplicationService;

  beforeEach(() => {
    identities = {
      create: jest.fn().mockResolvedValue(record),
      findById: jest.fn().mockResolvedValue(record),
      findByProviderSubject: jest.fn().mockResolvedValue(null),
      touchLastUsed: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    users = {
      findById: jest.fn().mockResolvedValue(user),
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new ExternalIdentityApplicationService(
      identities,
      users,
      audit as unknown as AuditLogService,
    );
  });

  describe('link', () => {
    it('links a firebase uid to an existing user and audits it', async () => {
      const result = await service.link(tenantId, actor, {
        userId: user.id,
        provider: 'firebase',
        subject: 'uid-1',
        email: 'ops@example.test',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          id: 'ident-1',
          userId: 'user-1',
          provider: 'firebase',
          subject: 'uid-1',
          email: 'ops@example.test',
          linkedAt: '2026-11-23T00:00:00.000Z',
          linkedByUserId: actor,
          lastUsedAt: null,
        });
      }
      expect(identities.create).toHaveBeenCalledWith(tenantId, {
        userId: user.id,
        provider: 'firebase',
        subject: 'uid-1',
        email: 'ops@example.test',
        linkedByUserId: actor,
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'external_identity.linked',
          actorId: actor,
          entityId: 'ident-1',
          outcome: 'success',
        }),
      );
    });

    it('returns NOT_FOUND for an unknown user', async () => {
      users.findById.mockResolvedValue(null);

      const result = await service.link(tenantId, actor, {
        userId: 'ghost',
        provider: 'firebase',
        subject: 'uid-1',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      expect(identities.create).not.toHaveBeenCalled();
    });

    it('returns DUPLICATE_IDENTITY when the uid is already linked', async () => {
      identities.findByProviderSubject.mockResolvedValue(record);

      const result = await service.link(tenantId, actor, {
        userId: user.id,
        provider: 'firebase',
        subject: 'uid-1',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('DUPLICATE_IDENTITY');
      expect(identities.create).not.toHaveBeenCalled();
    });

    it('maps a racing unique violation to DUPLICATE_IDENTITY', async () => {
      identities.create.mockRejectedValue({ code: 'P2002' });

      const result = await service.link(tenantId, actor, {
        userId: user.id,
        provider: 'firebase',
        subject: 'uid-1',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('DUPLICATE_IDENTITY');
    });
  });

  describe('unlink', () => {
    it('deletes the link and audits it', async () => {
      const result = await service.unlink(tenantId, actor, 'ident-1');

      expect(result.ok).toBe(true);
      expect(identities.delete).toHaveBeenCalledWith(tenantId, 'ident-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'external_identity.unlinked',
          entityId: 'ident-1',
        }),
      );
    });

    it('returns NOT_FOUND for an unknown link', async () => {
      identities.findById.mockResolvedValue(null);

      const result = await service.unlink(tenantId, actor, 'missing');

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      expect(identities.delete).not.toHaveBeenCalled();
    });
  });
});
