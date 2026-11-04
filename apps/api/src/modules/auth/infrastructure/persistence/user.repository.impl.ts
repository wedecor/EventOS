import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';

@Injectable()
export class UserRepositoryImpl
  extends TenantScopedRepository
  implements UserRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEmail(
    tenantId: string,
    email: string,
  ): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, email },
    });
    return user ? this.mapUser(user) : null;
  }

  async findById(tenantId: string, id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    return user ? this.mapUser(user) : null;
  }

  // R1-10 — persistence-only password replacement, tenant-scoped (ADR-016). The
  // version bump keeps the optimistic-concurrency field consistent with other writes.
  async updatePassword(
    tenantId: string,
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { passwordHash, version: { increment: 1 } },
    });
  }

  private mapUser(user: User): UserRecord {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      version: user.version,
    };
  }
}
