import { ChecklistTemplateApplicationService } from './checklist-template.application.service';

describe('ChecklistTemplateApplicationService', () => {
  const tenantId = 'tenant-1';
  const templateId = 'tmpl-1';

  let templateRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    countGeneratedForTemplate: jest.Mock;
  };
  let itemRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByTemplateId: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let service: ChecklistTemplateApplicationService;

  const baseTemplate = {
    id: templateId,
    tenantId,
    name: 'Pre-Event',
    description: null,
    eventTypes: ['Wedding'],
    category: 'pre_event' as const,
    status: 'active' as const,
    templateVersion: 1,
    sortOrder: 0,
    rootTemplateId: templateId,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  beforeEach(() => {
    templateRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      countGeneratedForTemplate: jest.fn(),
    };
    itemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTemplateId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    service = new ChecklistTemplateApplicationService(
      templateRepository as never,
      itemRepository,
    );
  });

  it('createTemplate persists a new active template', async () => {
    templateRepository.create.mockResolvedValue(baseTemplate);
    const result = await service.createTemplate(tenantId, {
      name: 'Pre-Event',
      eventTypes: ['Wedding'],
      category: 'pre_event',
    });
    expect(result.ok).toBe(true);
    expect(templateRepository.create).toHaveBeenCalled();
  });

  it('duplicateTemplate creates next version with copied items', async () => {
    templateRepository.findById.mockResolvedValue(baseTemplate);
    itemRepository.findByTemplateId.mockResolvedValue([
      {
        id: 'item-1',
        tenantId,
        templateId,
        title: 'Confirm venue',
        description: null,
        isRequired: true,
        defaultAssigneeRole: null,
        estimatedDurationMinutes: 30,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]);
    templateRepository.findMany.mockResolvedValue([baseTemplate]);
    templateRepository.create.mockResolvedValue({
      ...baseTemplate,
      id: 'tmpl-2',
      templateVersion: 2,
    });
    itemRepository.create.mockResolvedValue({
      id: 'item-2',
      title: 'Confirm venue',
    });

    const result = await service.duplicateTemplate(tenantId, templateId);
    expect(result.ok).toBe(true);
    expect(templateRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        templateVersion: 2,
        rootTemplateId: templateId,
      }),
    );
  });

  it('removeItem blocks when template has generated event checklists', async () => {
    templateRepository.findById.mockResolvedValue(baseTemplate);
    templateRepository.countGeneratedForTemplate.mockResolvedValue(2);
    const result = await service.removeItem(tenantId, templateId, 'item-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('archiveTemplate sets status archived', async () => {
    templateRepository.findById.mockResolvedValue(baseTemplate);
    templateRepository.update.mockResolvedValue({
      ...baseTemplate,
      status: 'archived',
      version: 2,
    });
    itemRepository.findByTemplateId.mockResolvedValue([]);
    const result = await service.archiveTemplate(tenantId, templateId, 1);
    expect(result.ok).toBe(true);
    expect(templateRepository.update).toHaveBeenCalledWith(
      tenantId,
      templateId,
      expect.objectContaining({ status: 'archived' }),
      1,
    );
  });
});
