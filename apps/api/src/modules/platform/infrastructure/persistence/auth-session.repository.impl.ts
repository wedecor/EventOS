import { Injectable } from '@nestjs/common';
import type { Session } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  AuthSessionRepository,
  type AuthSessionRecord,
} from '../../domain/repositories/auth-session.repository';

/**
 * Sprint 1 UAT auth-session port mapped onto Phase 1 `sessions` table
 * (`refresh_token_hash`). Keeps origin/main AuthSessionRepository API without
 * introducing a parallel `auth_sessions` table on this lineage.
 */
@Injectable()
export class AuthSessionRepositoryImpl implements AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRecord> {
    const session = await this.prisma.session.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        refreshTokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });

    return this.map(session);
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return session ? this.map(session) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  private map(session: Session): AuthSessionRecord {
    return {
      id: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      tokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
    };
  }
}
