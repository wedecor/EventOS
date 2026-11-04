import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  StaffMemberCreatedEvent,
  StaffMemberStatusChangedEvent,
  StaffMemberUpdatedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { StaffApplicationService } from './staff.application.service';
import type {
  StaffMemberRecord,
  StaffMemberRepository,
} from '../../domain/repositories/staff-member.repository';

describe('StaffApplicationService', () => {
  const tenantId = 'tenant-1';
  const staffMemberId = 'staff-1';

  const baseStaffMember: StaffMemberRecord = {
    id: staffMemberId,
    tenantId,
    userId: null,
    name: 'Ravi Kumar',
    role: 'decorator',
    department: 'operations',
    phone: '+919876543210',
    email: 'ravi@wedecor.test',
    employmentType: 'permanent',
    status: 'active',
    joinedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let staffMemberRepository: jest.Mocked<StaffMemberRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: StaffApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    staffMemberRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      resolveForAssignment: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new StaffApplicationService(
      staffMemberRepository,
      eventPublisher,
    );
  });

  it('createStaffMember rejects blank name', async () => {
    const result = await service.createStaffMember(tenantId, {
      name: '   ',
      role: 'decorator',
      phone: '+919876543210',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(staffMemberRepository.create).not.toHaveBeenCalled();
  });

  it('createStaffMember rejects blank role', async () => {
    const result = await service.createStaffMember(tenantId, {
      name: 'Ravi Kumar',
      role: '',
      phone: '+919876543210',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createStaffMember rejects blank phone', async () => {
    const result = await service.createStaffMember(tenantId, {
      name: 'Ravi Kumar',
      role: 'decorator',
      phone: '  ',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createStaffMember creates a staff member and publishes StaffMemberCreated', async () => {
    staffMemberRepository.create.mockResolvedValue(baseStaffMember);

    const result = await service.createStaffMember(tenantId, {
      name: 'Ravi Kumar',
      role: 'decorator',
      department: 'operations',
      phone: '+919876543210',
      email: 'ravi@wedecor.test',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(staffMemberId);
      expect(result.value.status).toBe('active');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(StaffMemberCreatedEvent));
  });

  it('getStaffMemberById returns NOT_FOUND when missing', async () => {
    staffMemberRepository.findById.mockResolvedValue(null);

    const result = await service.getStaffMemberById(tenantId, staffMemberId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('getStaffMemberById returns the staff member', async () => {
    staffMemberRepository.findById.mockResolvedValue(baseStaffMember);

    const result = await service.getStaffMemberById(tenantId, staffMemberId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Ravi Kumar');
    }
  });

  it('listStaffMembers returns staff members from the repository', async () => {
    staffMemberRepository.findMany.mockResolvedValue([baseStaffMember]);

    const result = await service.listStaffMembers(tenantId, {
      status: 'active',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
    expect(staffMemberRepository.findMany).toHaveBeenCalledWith(tenantId, {
      status: 'active',
    });
  });

  it('updateStaffMember returns NOT_FOUND when missing', async () => {
    staffMemberRepository.findById.mockResolvedValue(null);

    const result = await service.updateStaffMember(
      tenantId,
      staffMemberId,
      { status: 'inactive' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateStaffMember rejects blank name', async () => {
    staffMemberRepository.findById.mockResolvedValue(baseStaffMember);

    const result = await service.updateStaffMember(
      tenantId,
      staffMemberId,
      { name: '  ' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateStaffMember updates fields and publishes StaffMemberUpdated', async () => {
    const updated: StaffMemberRecord = {
      ...baseStaffMember,
      role: 'on_site_lead',
      version: 2,
    };
    staffMemberRepository.findById.mockResolvedValue(baseStaffMember);
    staffMemberRepository.update.mockResolvedValue(updated);

    const result = await service.updateStaffMember(
      tenantId,
      staffMemberId,
      { role: 'on_site_lead' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe('on_site_lead');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(StaffMemberUpdatedEvent));
  });

  it('updateStaffMember publishes StaffMemberStatusChanged on status change', async () => {
    const updated: StaffMemberRecord = {
      ...baseStaffMember,
      status: 'on_leave',
      version: 2,
    };
    staffMemberRepository.findById.mockResolvedValue(baseStaffMember);
    staffMemberRepository.update.mockResolvedValue(updated);

    const result = await service.updateStaffMember(
      tenantId,
      staffMemberId,
      { status: 'on_leave' },
      1,
    );

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(
      expect.any(StaffMemberStatusChangedEvent),
    );
  });

  it('updateStaffMember maps ConcurrentModificationError', async () => {
    staffMemberRepository.findById.mockResolvedValue(baseStaffMember);
    staffMemberRepository.update.mockRejectedValue(
      new ConcurrentModificationError('StaffMember', staffMemberId),
    );

    const result = await service.updateStaffMember(
      tenantId,
      staffMemberId,
      { status: 'inactive' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
