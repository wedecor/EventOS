import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditLogService,
} from '../../../../shared/audit';
import { ExternalIdentityRepository } from '../../domain/repositories/external-identity.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import {
  toExternalIdentityDto,
  type ExternalIdentityDto,
} from '../dtos/external-identity.dto';

export type LinkExternalIdentityInput = {
  userId: string;
  provider: 'firebase';
  subject: string;
  email?: string;
};

/**
 * M5-01 (ADR-019 phase 1) — administrators explicitly link a Firebase uid to an
 * EventOS user. This is the ONLY way an identity becomes usable for the Firebase
 * exchange (no auto-provisioning). TEMPORARY with the Firebase bridge.
 */
@Injectable()
export class ExternalIdentityApplicationService {
  constructor(
    private readonly externalIdentities: ExternalIdentityRepository,
    private readonly userRepository: UserRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async link(
    tenantId: string,
    actorUserId: string,
    input: LinkExternalIdentityInput,
  ): Promise<Result<ExternalIdentityDto>> {
    const user = await this.userRepository.findById(tenantId, input.userId);
    if (!user) {
      return failure('NOT_FOUND', 'User not found.');
    }

    const existing = await this.externalIdentities.findByProviderSubject(
      tenantId,
      input.provider,
      input.subject,
    );
    if (existing) {
      return failure(
        'DUPLICATE_IDENTITY',
        'This external identity is already linked.',
        { externalIdentityId: existing.id, userId: existing.userId },
      );
    }

    let record;
    try {
      record = await this.externalIdentities.create(tenantId, {
        userId: user.id,
        provider: input.provider,
        subject: input.subject,
        email: input.email ?? null,
        linkedByUserId: actorUserId,
      });
    } catch (error: unknown) {
      // Unique [provider, subject] raced with a concurrent link.
      if (isUniqueViolation(error)) {
        return failure(
          'DUPLICATE_IDENTITY',
          'This external identity is already linked.',
        );
      }
      throw error;
    }

    await this.auditLog.record({
      actorId: actorUserId,
      tenantId,
      action: AUDIT_ACTIONS.EXTERNAL_IDENTITY_LINKED,
      entityType: AUDIT_ENTITY_TYPES.EXTERNAL_IDENTITY,
      entityId: record.id,
      outcome: 'success',
      metadata: {
        provider: record.provider,
        subject: record.subject,
        userId: record.userId,
      },
    });

    return success(toExternalIdentityDto(record));
  }

  async unlink(
    tenantId: string,
    actorUserId: string,
    id: string,
  ): Promise<Result<{ success: true }>> {
    const record = await this.externalIdentities.findById(tenantId, id);
    if (!record) {
      return failure('NOT_FOUND', 'External identity not found.');
    }

    await this.externalIdentities.delete(tenantId, id);

    await this.auditLog.record({
      actorId: actorUserId,
      tenantId,
      action: AUDIT_ACTIONS.EXTERNAL_IDENTITY_UNLINKED,
      entityType: AUDIT_ENTITY_TYPES.EXTERNAL_IDENTITY,
      entityId: record.id,
      outcome: 'success',
      metadata: {
        provider: record.provider,
        subject: record.subject,
        userId: record.userId,
      },
    });

    return success({ success: true });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}
