import { StaffMemberRepositoryImpl } from './staff-member.repository.impl';

describe('StaffMemberRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const staffMemberId = 'staff-1';

  const prismaStaffMember = {
    id: staffMemberId,
    tenantId,
    userId: null,
    name: 'Ravi Kumar',
    role: 'decorator',
    department: 'operations',
    phone: '+919876543210',
    email: 'ravi@wedecor.test',
    employmentType: 'temporary' as const,
    status: 'active' as const,
    joinedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const prisma = {
    staffMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  let repository: StaffMemberRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new StaffMemberRepositoryImpl(prisma as never);
  });

  it('create maps a staff member record', async () => {
    prisma.staffMember.create.mockResolvedValue(prismaStaffMember);

    const result = await repository.create(tenantId, {
      name: 'Ravi Kumar',
      role: 'decorator',
      department: 'operations',
      phone: '+919876543210',
      email: 'ravi@wedecor.test',
    });

    expect(result.id).toBe(staffMemberId);
    expect(prisma.staffMember.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenant: { connect: { id: tenantId } },
        name: 'Ravi Kumar',
        phone: '+919876543210',
      }),
    });
  });

  it('findById scopes by tenant', async () => {
    prisma.staffMember.findFirst.mockResolvedValue(prismaStaffMember);

    const result = await repository.findById(tenantId, staffMemberId);

    expect(result?.id).toBe(staffMemberId);
    expect(prisma.staffMember.findFirst).toHaveBeenCalledWith({
      where: { id: staffMemberId, tenantId },
    });
  });

  it('findMany filters by status when provided', async () => {
    prisma.staffMember.findMany.mockResolvedValue([prismaStaffMember]);

    const result = await repository.findMany(tenantId, { status: 'active' });

    expect(result).toHaveLength(1);
    expect(prisma.staffMember.findMany).toHaveBeenCalledWith({
      where: { tenantId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('update increments version', async () => {
    prisma.staffMember.update.mockResolvedValue({
      ...prismaStaffMember,
      status: 'inactive',
      version: 2,
    });

    const result = await repository.update(
      tenantId,
      staffMemberId,
      { status: 'inactive' },
      1,
    );

    expect(result.version).toBe(2);
    expect(prisma.staffMember.update).toHaveBeenCalledWith({
      where: { id: staffMemberId, tenantId, version: 1 },
      data: expect.objectContaining({
        status: 'inactive',
        version: { increment: 1 },
      }),
    });
  });
});
