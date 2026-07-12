import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories.module';
import { FounderKpiQueryService } from './application/services/founder-kpi.query.service';
import { SalesDashboardQueryService } from './application/services/sales-dashboard.query.service';
import { ResourceDashboardQueryService } from './application/services/resource-dashboard.query.service';
import { FinanceDashboardQueryService } from './application/services/finance-dashboard.query.service';
import { OperationsDashboardQueryService } from './application/services/operations-dashboard.query.service';
import { DashboardController } from './presentation/dashboard.controller';

// EP1-KPI-001–EP1-KPI-007, EP1-MKT-001, EP1-MKT-002, EP1-SAL-001–EP1-SAL-003, EP1-OPS-001,
// EP1-OPS-004, EP1-OPS-005, EP1-STF-002, EP1-INV-003, EP1-INV-005, EP1-VEN-001, EP1-VEN-003,
// EP1-VEN-005, EP1-FIN-002–EP1-FIN-005, EP1-AUT-006 — Read-only Founder Dashboard & KPI module
// (Sprint 6). Depends only on existing repositories via `RepositoriesModule`; issues no writes.
@Module({
  imports: [RepositoriesModule],
  controllers: [DashboardController],
  providers: [
    FounderKpiQueryService,
    SalesDashboardQueryService,
    ResourceDashboardQueryService,
    FinanceDashboardQueryService,
    OperationsDashboardQueryService,
  ],
})
export class DashboardModule {}
