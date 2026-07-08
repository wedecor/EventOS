import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { CustomerCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import { CustomerApplicationService } from './customer.application.service';
import type {
  CustomerRecord,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';

describe('CustomerApplicationService', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';

  const baseCustomer: CustomerRecord = {
    id: customerId,
    tenantId,
    displayName: 'Priya Sharma',
    type: 'individual',
    status: 'active',
    primaryPhone: '+919999999999',
    primaryEmail: 'priya@example.com',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let customerRepository: jest.Mocked<CustomerRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: CustomerApplicationService;

  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    customerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByDisplayName: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new CustomerApplicationService(
      customerRepository,
      eventPublisher,
    );
  });

  it('rejects create when display name is empty', async () => {
    const result = await service.createCustomer(tenantId, {
      displayName: '   ',
      primaryPhone: '+919999999999',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects create when no contact is provided', async () => {
    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('creates a customer and publishes ClientCreated', async () => {
    customerRepository.findByPhone.mockResolvedValue([]);
    customerRepository.findByDisplayName.mockResolvedValue(null);
    customerRepository.create.mockResolvedValue(baseCustomer);

    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
      primaryPhone: '+919999999999',
    });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(CustomerCreatedEvent));
  });

  it('rejects duplicate customers during create', async () => {
    customerRepository.findByPhone.mockResolvedValue([baseCustomer]);

    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
      primaryPhone: '+919999999999',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_CUSTOMER');
    }
  });

  it('finds an existing customer by phone', async () => {
    customerRepository.findByPhone.mockResolvedValue([baseCustomer]);

    const result = await service.findExistingCustomer(tenantId, {
      phone: '+919999999999',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id).toBe(customerId);
    }
  });

  it('finds an existing customer by display name', async () => {
    customerRepository.findByDisplayName.mockResolvedValue(baseCustomer);

    const result = await service.findExistingCustomer(tenantId, {
      displayName: 'Priya Sharma',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id).toBe(customerId);
    }
  });

  it('returns null when no existing customer matches', async () => {
    customerRepository.findByPhone.mockResolvedValue([]);
    customerRepository.findByDisplayName.mockResolvedValue(null);

    const result = await service.findExistingCustomer(tenantId, {
      phone: '+910000000000',
      displayName: 'Unknown',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeNull();
    }
  });

  it('rejects update when customer is not found', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects update with empty display name', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: '   ' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects update that removes all contact details', async () => {
    customerRepository.findById.mockResolvedValue({
      ...baseCustomer,
      primaryEmail: null,
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { primaryPhone: '' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updates a customer with optimistic concurrency', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    customerRepository.update.mockResolvedValue({
      ...baseCustomer,
      displayName: 'Priya S.',
      version: 2,
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(true);
  });

  it('maps concurrent modification failures on update', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    customerRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Customer', customerId),
    );

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
