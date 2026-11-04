import { Module } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { PrismaAuditLogRepository } from './audit-log.repository.impl';
import { AuditLogService } from './audit-log.service';

// R1-08 — Wires the audit-log port to its Prisma adapter and exports the
// application-layer emitter. PrismaService is provided globally (PrismaModule).
@Module({
  providers: [
    { provide: AuditLogRepository, useClass: PrismaAuditLogRepository },
    AuditLogService,
  ],
  exports: [AuditLogService],
})
export class AuditModule {}
