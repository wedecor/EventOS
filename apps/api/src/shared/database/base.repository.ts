import { Prisma } from '@prisma/client';
import { ConcurrentModificationError } from './concurrent-modification.error';
import type { PrismaService } from '../../database/prisma.service';

export type TenantScopedWhere = {
  id: string;
  tenantId: string;
};

export type VersionedUpdateWhere = TenantScopedWhere & {
  version: number;
};

export abstract class TenantScopedRepository {
  protected constructor(protected readonly prisma: PrismaService) {}

  protected isNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  protected toConcurrentModification(
    aggregate: string,
    id: string,
    error: unknown,
  ): never {
    if (this.isNotFound(error)) {
      throw new ConcurrentModificationError(aggregate, id);
    }
    throw error;
  }

  protected toNumber(value: Prisma.Decimal | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value.toNumber();
  }
}
