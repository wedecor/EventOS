import { Injectable } from '@nestjs/common';
import type { CommunicationChannel } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { CommunicationTemplateRepository } from '../../domain/repositories/communication-template.repository';
import {
  toCommunicationTemplateDto,
  type CommunicationTemplateDto,
} from '../dtos/communication-template.dto';

export type CreateCommunicationTemplateInput = {
  name: string;
  category: string;
  channel?: CommunicationChannel | null;
  subject?: string | null;
  body: string;
};

export type UpdateCommunicationTemplateInput = {
  name?: string;
  category?: string;
  channel?: CommunicationChannel | null;
  subject?: string | null;
  body?: string;
};

@Injectable()
export class CommunicationTemplateApplicationService {
  constructor(
    private readonly templateRepository: CommunicationTemplateRepository,
  ) {}

  async create(
    tenantId: string,
    input: CreateCommunicationTemplateInput,
  ): Promise<Result<CommunicationTemplateDto>> {
    if (input.name.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Template name is required.');
    }
    if (input.category.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Template category is required.');
    }
    if (input.body.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Template body is required.');
    }

    const template = await this.templateRepository.create(tenantId, {
      name: input.name.trim(),
      category: input.category.trim(),
      channel: input.channel,
      subject: input.subject,
      body: input.body,
    });
    return success(toCommunicationTemplateDto(template));
  }

  async list(tenantId: string): Promise<Result<CommunicationTemplateDto[]>> {
    const rows = await this.templateRepository.findAll(tenantId);
    return success(rows.map(toCommunicationTemplateDto));
  }

  async getById(
    tenantId: string,
    id: string,
  ): Promise<Result<CommunicationTemplateDto>> {
    const template = await this.templateRepository.findById(tenantId, id);
    if (!template) {
      return failure('NOT_FOUND', 'Communication template not found.');
    }
    return success(toCommunicationTemplateDto(template));
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateCommunicationTemplateInput,
    version: number,
  ): Promise<Result<CommunicationTemplateDto>> {
    const existing = await this.templateRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Communication template not found.');
    }
    if (existing.status === 'archived') {
      return failure(
        'INVALID_STATE',
        'Cannot update an archived communication template.',
      );
    }

    try {
      const updated = await this.templateRepository.update(
        tenantId,
        id,
        {
          name: input.name?.trim(),
          category: input.category?.trim(),
          channel: input.channel,
          subject: input.subject,
          body: input.body,
        },
        version,
      );
      return success(toCommunicationTemplateDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async archive(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<Result<CommunicationTemplateDto>> {
    const existing = await this.templateRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Communication template not found.');
    }
    if (existing.status === 'archived') {
      return failure(
        'INVALID_STATE',
        'Communication template is already archived.',
      );
    }

    try {
      const updated = await this.templateRepository.update(
        tenantId,
        id,
        { status: 'archived' },
        version,
      );
      return success(toCommunicationTemplateDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  private handleConcurrency<T>(error: unknown, templateId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Communication template was modified by another request. Reload and retry.',
        { templateId },
      );
    }
    throw error;
  }
}
