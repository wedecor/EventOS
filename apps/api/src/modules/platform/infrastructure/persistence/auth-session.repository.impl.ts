import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  AuthSessionRepository,
  type AuthSessionRecord,
} from '../../domain/repositories/auth-session.repository';

@Injectable()
export class AuthSessionRepositoryImpl implements AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRecord> {
    const session = await this.prisma.authSession.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });

    return this.map(session);
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return session ? this.map(session) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.authSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  private map(session: {
    id: string;
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }): AuthSessionRecord {
    return {
      id: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
    };
  }
}
