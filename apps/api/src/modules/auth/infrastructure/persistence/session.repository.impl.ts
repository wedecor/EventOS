import { Injectable } from '@nestjs/common';
import type { Session } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateSessionData,
  SessionRecord,
  SessionRepository,
} from '../../domain/repositories/session.repository';

@Injectable()
export class SessionRepositoryImpl
  extends TenantScopedRepository
  implements SessionRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateSessionData,
  ): Promise<SessionRecord> {
    const session = await this.prisma.session.create({
      data: {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: data.userId } },
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
      },
    });
    return this.mapSession(session);
  }

  async findById(tenantId: string, id: string): Promise<SessionRecord | null> {
    const session = await this.prisma.session.findFirst({
      where: { id, tenantId },
    });
    return session ? this.mapSession(session) : null;
  }

  async revoke(tenantId: string, id: string): Promise<void> {
    // updateMany (not update) so revoking an unknown/already-revoked session is a
    // no-op rather than throwing — logout must be idempotent.
    await this.prisma.session.updateMany({
      where: { id, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(tenantId: string, userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tenantId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private mapSession(session: Session): SessionRecord {
    return {
      id: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
