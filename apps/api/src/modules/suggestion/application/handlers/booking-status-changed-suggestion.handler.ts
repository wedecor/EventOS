import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingStatusChangedEvent } from '../../../../shared/events/sprint1-domain.events';
import { SuggestionApplicationService } from '../services/suggestion.application.service';

@Injectable()
export class BookingStatusChangedSuggestionHandler {
  constructor(
    private readonly suggestionService: SuggestionApplicationService,
  ) {}

  @OnEvent('BookingStatusChanged')
  async handle(event: BookingStatusChangedEvent): Promise<void> {
    if (
      event.previousStatus !== 'approved' ||
      event.event.status !== 'in_preparation'
    ) {
      return;
    }

    await this.suggestionService.queueChecklistGenerate(
      event.tenantId,
      event.event.id,
    );
    await this.suggestionService.queueStaffAssign(
      event.tenantId,
      event.event.id,
    );
  }
}
