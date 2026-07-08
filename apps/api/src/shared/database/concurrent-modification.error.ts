export class ConcurrentModificationError extends Error {
  readonly code = 'CONCURRENT_MODIFICATION';

  constructor(
    readonly aggregate: string,
    readonly id: string,
  ) {
    super(
      `Concurrent modification detected for ${aggregate} ${id}. Reload and retry.`,
    );
    this.name = 'ConcurrentModificationError';
  }
}
