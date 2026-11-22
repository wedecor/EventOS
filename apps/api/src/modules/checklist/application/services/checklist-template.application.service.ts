import { Injectable } from '@nestjs/common';
import type { ChecklistTemplateStatus, TaskCategory } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { ChecklistTemplateRepository } from '../../domain/repositories/checklist-template.repository';
import { ChecklistTemplateItemRepository } from '../../domain/repositories/checklist-template-item.repository';
import {
  toChecklistTemplateDto,
  toChecklistTemplateItemDto,
  type ChecklistTemplateDto,
  type ChecklistTemplateItemDto,
} from '../dtos/checklist-template.dto';

export type CreateTemplateInput = {
  name: string;
  description?: string | null;
  eventTypes?: string[];
  category?: TaskCategory;
  sortOrder?: number;
};

export type UpdateTemplateInput = {
  name?: string;
  description?: string | null;
  eventTypes?: string[];
  category?: TaskCategory;
  status?: ChecklistTemplateStatus;
  sortOrder?: number;
};

export type CreateTemplateItemInput = {
  title: string;
  description?: string | null;
  isRequired?: boolean;
  defaultAssigneeRole?: string | null;
  estimatedDurationMinutes?: number | null;
  sortOrder?: number;
};

export type UpdateTemplateItemInput = {
  title?: string;
  description?: string | null;
  isRequired?: boolean;
  defaultAssigneeRole?: string | null;
  estimatedDurationMinutes?: number | null;
  sortOrder?: number;
};

// P2-02 — Checklist template administration
@Injectable()
export class ChecklistTemplateApplicationService {
  constructor(
    private readonly templateRepository: ChecklistTemplateRepository,
    private readonly itemRepository: ChecklistTemplateItemRepository,
  ) {}

  async listTemplates(
    tenantId: string,
    status?: ChecklistTemplateStatus,
  ): Promise<Result<ChecklistTemplateDto[]>> {
    const templates = await this.templateRepository.findMany(tenantId, {
      status,
    });
    const dtos = await Promise.all(
      templates.map(async (template) => {
        const items = await this.itemRepository.findByTemplateId(
          tenantId,
          template.id,
        );
        return toChecklistTemplateDto(template, items);
      }),
    );
    return success(dtos);
  }

  async getTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<Result<ChecklistTemplateDto>> {
    const template = await this.templateRepository.findById(
      tenantId,
      templateId,
    );
    if (!template) {
      return failure('NOT_FOUND', 'Checklist template not found.');
    }
    const items = await this.itemRepository.findByTemplateId(
      tenantId,
      templateId,
    );
    return success(toChecklistTemplateDto(template, items));
  }

  async listVersions(
    tenantId: string,
    templateId: string,
  ): Promise<Result<ChecklistTemplateDto[]>> {
    const template = await this.templateRepository.findById(
      tenantId,
      templateId,
    );
    if (!template) {
      return failure('NOT_FOUND', 'Checklist template not found.');
    }
    const versions = await this.templateRepository.findMany(tenantId, {
      rootTemplateId: template.rootTemplateId,
    });
    const dtos = await Promise.all(
      versions.map(async (version) => {
        const items = await this.itemRepository.findByTemplateId(
          tenantId,
          version.id,
        );
        return toChecklistTemplateDto(version, items);
      }),
    );
    return success(dtos.sort((a, b) => b.templateVersion - a.templateVersion));
  }

  async createTemplate(
    tenantId: string,
    input: CreateTemplateInput,
  ): Promise<Result<ChecklistTemplateDto>> {
    if (input.name.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Template name is required.');
    }
    const template = await this.templateRepository.create(tenantId, {
      name: input.name.trim(),
      description: input.description,
      eventTypes: input.eventTypes ?? [],
      category: input.category,
      sortOrder: input.sortOrder,
    });
    return success(toChecklistTemplateDto(template, []));
  }

  async updateTemplate(
    tenantId: string,
    templateId: string,
    input: UpdateTemplateInput,
    version: number,
  ): Promise<Result<ChecklistTemplateDto>> {
    const existing = await this.templateRepository.findById(
      tenantId,
      templateId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Checklist template not found.');
    }
    if (existing.status === 'archived' && input.status !== 'active') {
      return failure(
        'INVALID_STATE',
        'Archived templates cannot be edited. Duplicate to create a new version.',
      );
    }
    try {
      const template = await this.templateRepository.update(
        tenantId,
        templateId,
        {
          name: input.name?.trim(),
          description: input.description,
          eventTypes: input.eventTypes,
          category: input.category,
          status: input.status,
          sortOrder: input.sortOrder,
        },
        version,
      );
      const items = await this.itemRepository.findByTemplateId(
        tenantId,
        templateId,
      );
      return success(toChecklistTemplateDto(template, items));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Template was modified by another request. Reload and retry.',
          { templateId },
        );
      }
      throw error;
    }
  }

  async archiveTemplate(
    tenantId: string,
    templateId: string,
    version: number,
  ): Promise<Result<ChecklistTemplateDto>> {
    return this.updateTemplate(
      tenantId,
      templateId,
      { status: 'archived' },
      version,
    );
  }

  async duplicateTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<Result<ChecklistTemplateDto>> {
    const existing = await this.templateRepository.findById(
      tenantId,
      templateId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Checklist template not found.');
    }
    const items = await this.itemRepository.findByTemplateId(
      tenantId,
      templateId,
    );
    const versions = await this.templateRepository.findMany(tenantId, {
      rootTemplateId: existing.rootTemplateId,
    });
    const nextVersion =
      Math.max(...versions.map((v) => v.templateVersion), 0) + 1;

    const duplicate = await this.templateRepository.create(tenantId, {
      name: existing.name,
      description: existing.description,
      eventTypes: existing.eventTypes,
      category: existing.category,
      status: 'active',
      templateVersion: nextVersion,
      sortOrder: existing.sortOrder,
      rootTemplateId: existing.rootTemplateId,
    });

    const copiedItems = [];
    for (const item of items) {
      const created = await this.itemRepository.create(tenantId, duplicate.id, {
        title: item.title,
        description: item.description,
        isRequired: item.isRequired,
        defaultAssigneeRole: item.defaultAssigneeRole,
        estimatedDurationMinutes: item.estimatedDurationMinutes,
        sortOrder: item.sortOrder,
      });
      copiedItems.push(created);
    }

    return success(toChecklistTemplateDto(duplicate, copiedItems));
  }

  async addItem(
    tenantId: string,
    templateId: string,
    input: CreateTemplateItemInput,
  ): Promise<Result<ChecklistTemplateItemDto>> {
    const template = await this.templateRepository.findById(
      tenantId,
      templateId,
    );
    if (!template) {
      return failure('NOT_FOUND', 'Checklist template not found.');
    }
    if (template.status === 'archived') {
      return failure(
        'INVALID_STATE',
        'Cannot add items to an archived template.',
      );
    }
    if (input.title.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Item title is required.');
    }
    const item = await this.itemRepository.create(tenantId, templateId, {
      title: input.title.trim(),
      description: input.description,
      isRequired: input.isRequired,
      defaultAssigneeRole: input.defaultAssigneeRole,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      sortOrder: input.sortOrder,
    });
    return success(toChecklistTemplateItemDto(item));
  }

  async updateItem(
    tenantId: string,
    templateId: string,
    itemId: string,
    input: UpdateTemplateItemInput,
    version: number,
  ): Promise<Result<ChecklistTemplateItemDto>> {
    const item = await this.itemRepository.findById(tenantId, itemId);
    if (!item || item.templateId !== templateId) {
      return failure('NOT_FOUND', 'Template item not found.');
    }
    try {
      const updated = await this.itemRepository.update(
        tenantId,
        itemId,
        {
          title: input.title?.trim(),
          description: input.description,
          isRequired: input.isRequired,
          defaultAssigneeRole: input.defaultAssigneeRole,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          sortOrder: input.sortOrder,
        },
        version,
      );
      return success(toChecklistTemplateItemDto(updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Template item was modified by another request. Reload and retry.',
          { itemId },
        );
      }
      throw error;
    }
  }

  async removeItem(
    tenantId: string,
    templateId: string,
    itemId: string,
  ): Promise<Result<void>> {
    const template = await this.templateRepository.findById(
      tenantId,
      templateId,
    );
    if (!template) {
      return failure('NOT_FOUND', 'Checklist template not found.');
    }
    const used = await this.templateRepository.countGeneratedForTemplate(
      tenantId,
      templateId,
    );
    if (used > 0) {
      return failure(
        'INVALID_STATE',
        'Cannot remove items from a template that has been used to generate event checklists. Duplicate the template instead.',
      );
    }
    const item = await this.itemRepository.findById(tenantId, itemId);
    if (!item || item.templateId !== templateId) {
      return failure('NOT_FOUND', 'Template item not found.');
    }
    await this.itemRepository.remove(tenantId, itemId);
    return success(undefined);
  }
}
