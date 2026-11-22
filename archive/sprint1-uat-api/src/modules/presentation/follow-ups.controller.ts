import { Body, Controller, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { TenantContext } from '../../auth/tenant.context';
import { unwrapResult } from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LeadApplicationService } from '../lead/application/services/lead.application.service';

const updateFollowUpSchema = z.object({
  dueAt: z.coerce.date().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['pending', 'done', 'cancelled']).optional(),
  version: z.number().int().positive(),
});

@ApiTags('Follow-ups')
@Controller('follow-ups')
export class FollowUpsController {
  constructor(
    private readonly leadService: LeadApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Patch(':id')
  async updateFollowUp(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFollowUpSchema))
    body: {
      version: number;
      dueAt?: Date;
      notes?: string | null;
      status?: 'pending' | 'done' | 'cancelled';
    },
  ) {
    const { version, ...patch } = body;
    const data = unwrapResult(
      await this.leadService.updateFollowUp(
        this.tenantContext.getTenantId(),
        id,
        patch,
        version,
      ),
    );
    return { data };
  }
}
