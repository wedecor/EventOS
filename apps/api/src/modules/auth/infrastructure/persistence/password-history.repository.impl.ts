import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import { PasswordHistoryRepository } from '../../domain/repositories/password-history.repository';

// R1-10 — persistence for retired password hashes (docs/14 §Password Requirements).
// Persistence-only: no policy/reuse logic. Tenant-scoped per ADR-016.
@Injectable()
export class PasswordHistoryRepositoryImpl
  extends TenantScopedRepository
  implements PasswordHistoryRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findRecentHashes(
    tenantId: string,
    userId: string,
    limit: number,
  ): Promise<string[]> {
    const rows = await this.prisma.passwordHistory.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { passwordHash: true },
    });
    return rows.map((row) => row.passwordHash);
  }

  async add(
    tenantId: string,
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.passwordHistory.create({
      data: {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: userId } },
        passwordHash,
      },
    });
  }
}
