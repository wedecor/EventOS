import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { ChecklistTemplateRepository } from '../../domain/repositories/checklist-template.repository';
import { ChecklistTemplateItemRepository } from '../../domain/repositories/checklist-template-item.repository';
import { EventChecklistRepository } from '../../domain/repositories/event-checklist.repository';
import { EventChecklistItemRepository } from '../../domain/repositories/event-checklist-item.repository';
import {
  toEventChecklistDto,
  toEventChecklistItemDto,
  type EventChecklistDto,
  type EventChecklistItemDto,
} from '../dtos/event-checklist.dto';

export type GenerateEventChecklistsInput = {
  bookingId: string;
  templateIds?: string[];
};

export type UpdateEventChecklistItemInput = {
  isCompleted?: boolean;
  notes?: string | null;
  completedByUserId: string;
};

// P2-02 — Generate and execute event-specific checklist copies
@Injectable()
export class EventChecklistApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly templateRepository: ChecklistTemplateRepository,
    private readonly templateItemRepository: ChecklistTemplateItemRepository,
    private readonly eventChecklistRepository: EventChecklistRepository,
    private readonly eventChecklistItemRepository: EventChecklistItemRepository,
  ) {}

  async listForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<EventChecklistDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }
    const checklists = await this.eventChecklistRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    const dtos = await Promise.all(
      checklists.map(async (checklist) => {
        const items = await this.eventChecklistItemRepository.findByChecklistId(
          tenantId,
          checklist.id,
        );
        return toEventChecklistDto(checklist, items);
      }),
    );
    return success(dtos);
  }

  async getById(
    tenantId: string,
    checklistId: string,
  ): Promise<Result<EventChecklistDto>> {
    const checklist = await this.eventChecklistRepository.findById(
      tenantId,
      checklistId,
    );
    if (!checklist) {
      return failure('NOT_FOUND', 'Event checklist not found.');
    }
    const items = await this.eventChecklistItemRepository.findByChecklistId(
      tenantId,
      checklistId,
    );
    return success(toEventChecklistDto(checklist, items));
  }

  async generateFromTemplates(
    tenantId: string,
    input: GenerateEventChecklistsInput,
  ): Promise<Result<EventChecklistDto[]>> {
    const booking = await this.eventRepository.findById(
      tenantId,
      input.bookingId,
    );
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }
    if (booking.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot generate checklists for a cancelled booking.',
      );
    }

    let templates;
    if (input.templateIds && input.templateIds.length > 0) {
      const found = await Promise.all(
        input.templateIds.map((id) =>
          this.templateRepository.findById(tenantId, id),
        ),
      );
      templates = found.filter(
        (t): t is NonNullable<typeof t> => t !== null && t.status === 'active',
      );
      if (templates.length === 0) {
        return failure(
          'VALIDATION_ERROR',
          'No active templates found for the provided ids.',
        );
      }
    } else {
      templates = await this.templateRepository.findActiveMatchingEventType(
        tenantId,
        booking.eventType,
      );
    }

    const generated: EventChecklistDto[] = [];
    for (const template of templates) {
      const existing =
        await this.eventChecklistRepository.findByBookingAndTemplate(
          tenantId,
          input.bookingId,
          template.id,
        );
      if (existing) {
        const items = await this.eventChecklistItemRepository.findByChecklistId(
          tenantId,
          existing.id,
        );
        generated.push(toEventChecklistDto(existing, items));
        continue;
      }

      const templateItems = await this.templateItemRepository.findByTemplateId(
        tenantId,
        template.id,
      );
      const checklist = await this.eventChecklistRepository.create(tenantId, {
        bookingId: input.bookingId,
        templateId: template.id,
        templateVersion: template.templateVersion,
        name: template.name,
        description: template.description,
        category: template.category,
        sortOrder: template.sortOrder,
      });

      const items = [];
      for (const templateItem of templateItems) {
        const item = await this.eventChecklistItemRepository.create(
          tenantId,
          checklist.id,
          {
            title: templateItem.title,
            description: templateItem.description,
            isRequired: templateItem.isRequired,
            defaultAssigneeRole: templateItem.defaultAssigneeRole,
            estimatedDurationMinutes: templateItem.estimatedDurationMinutes,
            sortOrder: templateItem.sortOrder,
          },
        );
        items.push(item);
      }
      generated.push(toEventChecklistDto(checklist, items));
    }

    return success(generated);
  }

  async updateItem(
    tenantId: string,
    checklistId: string,
    itemId: string,
    input: UpdateEventChecklistItemInput,
    version: number,
  ): Promise<Result<EventChecklistItemDto>> {
    const checklist = await this.eventChecklistRepository.findById(
      tenantId,
      checklistId,
    );
    if (!checklist) {
      return failure('NOT_FOUND', 'Event checklist not found.');
    }
    const item = await this.eventChecklistItemRepository.findById(
      tenantId,
      itemId,
    );
    if (!item || item.checklistId !== checklistId) {
      return failure('NOT_FOUND', 'Checklist item not found.');
    }

    const isCompleted = input.isCompleted ?? item.isCompleted;
    try {
      const updated = await this.eventChecklistItemRepository.update(
        tenantId,
        itemId,
        {
          isCompleted,
          completedAt: isCompleted ? (item.completedAt ?? new Date()) : null,
          completedByUserId: isCompleted ? input.completedByUserId : null,
          notes: input.notes !== undefined ? input.notes : item.notes,
        },
        version,
      );
      return success(toEventChecklistItemDto(updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Checklist item was modified by another request. Reload and retry.',
          { itemId },
        );
      }
      throw error;
    }
  }
}
