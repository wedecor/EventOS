import type { PrismaService } from '../../../../database/prisma.service';

/**
 * Minimal in-memory stand-in for the `integrationDelivery` Prisma delegate
 * (just the operations PostgresEnquiriesDeliveryLog uses) so ledger semantics —
 * PK uniqueness, ON CONFLICT DO NOTHING, filtered updates/deletes — run in unit
 * tests without a database.
 */
export type DeliveryRow = {
  deliveryId: string;
  tenantId: string;
  source: string;
  receivedAt: Date;
  outcome: string | null;
  enquiryId: string | null;
  detail: string | null;
};

type Where = Record<string, unknown>;

function matchesField(actual: unknown, condition: unknown): boolean {
  if (condition !== null && typeof condition === 'object') {
    const c = condition as Record<string, unknown>;
    if ('not' in c) return actual !== c.not;
    if ('lt' in c && !((actual as Date) < (c.lt as Date))) return false;
    if ('gte' in c && !((actual as Date) >= (c.gte as Date))) return false;
    return true;
  }
  return actual === condition;
}

function matches(row: DeliveryRow, where: Where = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR') {
      return (condition as Where[]).some((branch) => matches(row, branch));
    }
    return matchesField(row[key as keyof DeliveryRow], condition);
  });
}

export function createFakeIntegrationDeliveryPrisma() {
  const rows = new Map<string, DeliveryRow>();
  const select = (where?: Where) =>
    [...rows.values()].filter((row) => matches(row, where));

  const delegate = {
    updateMany: ({
      where,
      data,
    }: {
      where: Where;
      data: Partial<DeliveryRow>;
    }) => {
      const hits = select(where);
      for (const row of hits) Object.assign(row, data);
      return Promise.resolve({ count: hits.length });
    },
    createMany: ({
      data,
      skipDuplicates,
    }: {
      data: Array<Partial<DeliveryRow> & { deliveryId: string }>;
      skipDuplicates?: boolean;
    }) => {
      let count = 0;
      for (const item of data) {
        if (rows.has(item.deliveryId)) {
          if (skipDuplicates) continue;
          return Promise.reject(new Error('Unique constraint failed'));
        }
        rows.set(item.deliveryId, {
          tenantId: '',
          source: '',
          receivedAt: new Date(),
          outcome: null,
          enquiryId: null,
          detail: null,
          ...item,
        });
        count += 1;
      }
      return Promise.resolve({ count });
    },
    deleteMany: ({ where }: { where: Where }) => {
      const hits = select(where);
      for (const row of hits) rows.delete(row.deliveryId);
      return Promise.resolve({ count: hits.length });
    },
    upsert: ({
      where,
      create,
      update,
    }: {
      where: { deliveryId: string };
      create: DeliveryRow;
      update: Partial<DeliveryRow>;
    }) => {
      const existing = rows.get(where.deliveryId);
      if (existing) Object.assign(existing, update);
      else rows.set(create.deliveryId, { ...create });
      return Promise.resolve(rows.get(where.deliveryId));
    },
    aggregate: ({ where }: { where: Where }) => {
      const times = select(where).map((row) => row.receivedAt.getTime());
      return Promise.resolve({
        _max: {
          receivedAt: times.length ? new Date(Math.max(...times)) : null,
        },
      });
    },
    groupBy: ({ where }: { where: Where }) => {
      const counts = new Map<string, number>();
      for (const row of select(where)) {
        const key = row.outcome as string;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return Promise.resolve(
        [...counts].map(([outcome, all]) => ({
          outcome,
          _count: { _all: all },
        })),
      );
    },
    findMany: ({ where, take }: { where: Where; take?: number }) =>
      Promise.resolve(
        select(where)
          .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
          .slice(0, take),
      ),
  };

  return {
    rows,
    prisma: { integrationDelivery: delegate } as unknown as PrismaService,
  };
}
