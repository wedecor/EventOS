import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import { SuggestionApplicationService } from '../services/suggestion.application.service';

@Injectable()
export class EventCreatedSuggestionHandler {
  constructor(
    private readonly suggestionService: SuggestionApplicationService,
  ) {}

  @OnEvent('EventCreated')
  async handle(event: EventCreatedEvent): Promise<void> {
    await this.suggestionService.queueWorkspaceCreate(
      event.tenantId,
      event.event.id,
    );
  }
}
