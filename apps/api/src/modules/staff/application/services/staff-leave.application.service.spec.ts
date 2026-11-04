import { StaffLeaveApplicationService } from './staff-leave.application.service';

describe('StaffLeaveApplicationService', () => {
  const tenantId = 'tenant-1';
  const staffMemberId = 'staff-1';

  const staffMember = {
    id: staffMemberId,
    tenantId,
    userId: null,
    name: 'Ravi',
    role: 'decorator',
    department: null,
    phone: '+91',
    email: null,
    employmentType: 'permanent' as const,
    status: 'active' as const,
    joinedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const leaveRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByStaffMemberId: jest.fn(),
    findApprovedOverlapping: jest.fn(),
    findApprovedInRange: jest.fn(),
    update: jest.fn(),
  };
  const staffRepo = {
    findById: jest.fn(),
  };

  const service = new StaffLeaveApplicationService(
    leaveRepo,
    staffRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    staffRepo.findById.mockResolvedValue(staffMember);
  });

  it('create rejects end before start', async () => {
    const result = await service.create(tenantId, {
      staffMemberId,
      leaveType: 'casual',
      startDate: '2026-08-10',
      endDate: '2026-08-09',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('create requests leave in requested status', async () => {
    leaveRepo.create.mockResolvedValue({
      id: 'leave-1',
      tenantId,
      staffMemberId,
      leaveType: 'casual',
      status: 'requested',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-11'),
      reason: null,
      notes: null,
      reviewedByUserId: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.create(tenantId, {
      staffMemberId,
      leaveType: 'casual',
      startDate: '2026-08-10',
      endDate: '2026-08-11',
    });
    expect(result.ok).toBe(true);
  });

  it('review approves requested leave', async () => {
    leaveRepo.findById.mockResolvedValue({
      id: 'leave-1',
      tenantId,
      staffMemberId,
      leaveType: 'casual',
      status: 'requested',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-11'),
      reason: null,
      notes: null,
      reviewedByUserId: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    leaveRepo.update.mockResolvedValue({
      id: 'leave-1',
      tenantId,
      staffMemberId,
      leaveType: 'casual',
      status: 'approved',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-11'),
      reason: null,
      notes: null,
      reviewedByUserId: 'user-1',
      reviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const result = await service.review(
      tenantId,
      'leave-1',
      { status: 'approved', reviewedByUserId: 'user-1' },
      1,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('approved');
    }
  });

  it('review rejects approve when not requested', async () => {
    leaveRepo.findById.mockResolvedValue({
      id: 'leave-1',
      tenantId,
      staffMemberId,
      leaveType: 'casual',
      status: 'approved',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-11'),
      reason: null,
      notes: null,
      reviewedByUserId: 'user-1',
      reviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const result = await service.review(
      tenantId,
      'leave-1',
      { status: 'rejected', reviewedByUserId: 'user-2' },
      2,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });
});
