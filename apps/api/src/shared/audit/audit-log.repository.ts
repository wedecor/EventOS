import type { AuditEntry } from './audit-log.entry';

// Persistence port for audit records. Infrastructure implements this; it performs
// persistence only and holds no business logic (docs/10 §Repositories; layer rules).
// Abstract class (not interface) per the codebase repository convention.
export abstract class AuditLogRepository {
  abstract record(entry: AuditEntry): Promise<void>;
}
