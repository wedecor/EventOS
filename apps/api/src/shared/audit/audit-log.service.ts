import { Injectable, Logger } from '@nestjs/common';
import type { AuditEntry } from './audit-log.entry';
import { AuditLogRepository } from './audit-log.repository';

// Application-layer emitter for audit records. Application services call `record()`
// on both success and failure paths; the infrastructure adapter persists the entry
// (docs/10 §Audit Strategy).
//
// Best-effort durability: a failure to persist an audit record must never mask or
// roll back the business operation it describes. Persistence errors are logged via
// the existing structured logger (docs/10 §Logging Strategy) and swallowed.
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly repository: AuditLogRepository) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.repository.record(entry);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to persist audit log (action=${entry.action}, entity=${entry.entityType}:${entry.entityId}, outcome=${entry.outcome})`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
