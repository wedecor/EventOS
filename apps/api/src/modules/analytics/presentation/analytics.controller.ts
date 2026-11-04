import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { z } from 'zod';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiZodQuery,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { AnalyticsApplicationService } from '../application/services/analytics.application.service';

const periodQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

const trendsQuerySchema = periodQuerySchema.extend({
  granularity: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

const exportQuerySchema = periodQuerySchema.extend({
  dataset: z.enum([
    'dashboard',
    'sales',
    'finance',
    'staff',
    'vendors',
    'inventory',
    'customers',
    'operations',
    'trends',
  ]),
  format: z.enum(['csv', 'xlsx']).optional(),
});

type PeriodQuery = z.infer<typeof periodQuerySchema>;
type TrendsQuery = z.infer<typeof trendsQuerySchema>;
type ExportQuery = z.infer<typeof exportQuerySchema>;

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsApplicationService) {}

  @Get('dashboard')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Founder BI dashboard KPIs (read-only)' })
  @ApiZodQuery('from', periodQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', periodQuerySchema.shape.to, { required: false })
  @ApiDataResponse(200, 'Analytics dashboard')
  @ApiStandardErrors()
  async dashboard(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(periodQuerySchema)) query: PeriodQuery,
  ) {
    return resultToResponse(
      await this.analyticsService.getDashboard(tenantId, query),
    );
  }

  @Get('sales')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Sales analytics (read-only)' })
  @ApiZodQuery('from', periodQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', periodQuerySchema.shape.to, { required: false })
  @ApiDataResponse(200, 'Sales analytics')
  @ApiStandardErrors()
  async sales(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(periodQuerySchema)) query: PeriodQuery,
  ) {
    return resultToResponse(
      await this.analyticsService.getSales(tenantId, query),
    );
  }

  @Get('finance')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Financial analytics (read-only)' })
  @ApiZodQuery('from', periodQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', periodQuerySchema.shape.to, { required: false })
  @ApiDataResponse(200, 'Finance analytics')
  @ApiStandardErrors()
  async finance(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(periodQuerySchema)) query: PeriodQuery,
  ) {
    return resultToResponse(
      await this.analyticsService.getFinance(tenantId, query),
    );
  }

  @Get('staff')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Staff utilisation analytics (read-only)' })
  @ApiDataResponse(200, 'Staff analytics')
  @ApiStandardErrors()
  async staff(@TenantId() tenantId: string) {
    return resultToResponse(await this.analyticsService.getStaff(tenantId));
  }

  @Get('vendors')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Vendor / procurement analytics (read-only)' })
  @ApiDataResponse(200, 'Vendor analytics')
  @ApiStandardErrors()
  async vendors(@TenantId() tenantId: string) {
    return resultToResponse(await this.analyticsService.getVendors(tenantId));
  }

  @Get('inventory')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Inventory analytics (read-only)' })
  @ApiDataResponse(200, 'Inventory analytics')
  @ApiStandardErrors()
  async inventory(@TenantId() tenantId: string) {
    return resultToResponse(await this.analyticsService.getInventory(tenantId));
  }

  @Get('customers')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Customer retention analytics (read-only)' })
  @ApiZodQuery('from', periodQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', periodQuerySchema.shape.to, { required: false })
  @ApiDataResponse(200, 'Customer analytics')
  @ApiStandardErrors()
  async customers(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(periodQuerySchema)) query: PeriodQuery,
  ) {
    return resultToResponse(
      await this.analyticsService.getCustomers(tenantId, query),
    );
  }

  @Get('operations')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Operational analytics dashboard (read-only)' })
  @ApiDataResponse(200, 'Operations analytics')
  @ApiStandardErrors()
  async operations(@TenantId() tenantId: string) {
    return resultToResponse(
      await this.analyticsService.getOperations(tenantId),
    );
  }

  @Get('trends')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Trend reports (no forecasting)' })
  @ApiZodQuery('from', trendsQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', trendsQuerySchema.shape.to, { required: false })
  @ApiZodQuery('granularity', trendsQuerySchema.shape.granularity, {
    required: false,
  })
  @ApiDataResponse(200, 'Analytics trends')
  @ApiStandardErrors()
  async trends(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(trendsQuerySchema)) query: TrendsQuery,
  ) {
    return resultToResponse(
      await this.analyticsService.getTrends(tenantId, query),
    );
  }

  @Get('export')
  @Permissions('analytics:read')
  @ApiOperation({
    summary: 'Export analytics dataset as CSV or Excel-compatible spreadsheet',
  })
  @ApiZodQuery('dataset', exportQuerySchema.shape.dataset, { required: true })
  @ApiZodQuery('format', exportQuerySchema.shape.format, { required: false })
  @ApiZodQuery('from', exportQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', exportQuerySchema.shape.to, { required: false })
  @ApiDataResponse(200, 'Export payload')
  @ApiStandardErrors()
  @Header('Cache-Control', 'no-store')
  async export(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(exportQuerySchema)) query: ExportQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.analyticsService.exportDataset(tenantId, query);
    if (result.ok) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.value.fileName}"`,
      );
    }
    return resultToResponse(result);
  }
}
