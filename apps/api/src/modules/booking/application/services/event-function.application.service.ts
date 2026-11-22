import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventFunctionRepository } from '../../domain/repositories/event-function.repository';
import { EventRepository } from '../../domain/repositories/event.repository';
import {
  toEventFunctionDto,
  type EventFunctionDto,
} from '../dtos/event-function.dto';

@Injectable()
export class EventFunctionApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventFunctionRepository: EventFunctionRepository,
  ) {}

  async listForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<EventFunctionDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }
    const functions = await this.eventFunctionRepository.listByBooking(
      tenantId,
      bookingId,
    );
    return success(functions.map(toEventFunctionDto));
  }
}
