import type { PrismaService } from '../../../../database/prisma.service';
import { PasswordHistoryRepositoryImpl } from './password-history.repository.impl';

describe('PasswordHistoryRepositoryImpl (R1-10)', () => {
  let findMany: jest.Mock;
  let create: jest.Mock;
  let prisma: PrismaService;
  let repository: PasswordHistoryRepositoryImpl;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    create = jest.fn().mockResolvedValue({ id: 'history-1' });
    prisma = {
      passwordHistory: { findMany, create },
    } as unknown as PrismaService;
    repository = new PasswordHistoryRepositoryImpl(prisma);
  });

  it('reads the most recent hashes for the user, newest first, capped at the limit', async () => {
    findMany.mockResolvedValue([
      { passwordHash: 'hash-a' },
      { passwordHash: 'hash-b' },
    ]);

    const result = await repository.findRecentHashes('tenant-1', 'user-1', 4);

    expect(result).toEqual(['hash-a', 'hash-b']);
    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { passwordHash: true },
    });
  });

  it('appends a retired password hash, connecting tenant and user', async () => {
    await repository.add('tenant-1', 'user-1', 'retired-hash');

    expect(create).toHaveBeenCalledWith({
      data: {
        tenant: { connect: { id: 'tenant-1' } },
        user: { connect: { id: 'user-1' } },
        passwordHash: 'retired-hash',
      },
    });
  });
});
