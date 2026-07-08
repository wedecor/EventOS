export abstract class DomainEvent {
  abstract readonly eventName: string;
  readonly occurredAt = new Date();
}

export abstract class DomainEventPublisher {
  abstract publish(event: DomainEvent): void;
}
