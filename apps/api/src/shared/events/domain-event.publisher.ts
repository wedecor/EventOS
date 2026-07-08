import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPublisher } from './domain-event.base';

@Injectable()
export class NestDomainEventPublisher extends DomainEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {
    super();
  }

  publish(event: DomainEvent): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
