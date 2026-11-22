import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantContext } from '../../auth/tenant.context';
import { unwrapResult } from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SuggestionApplicationService } from '../suggestion/application/services/suggestion.application.service';
import { acceptSuggestionBodySchema } from './schemas/suggestion.schemas';

@ApiTags('Suggestions')
@Controller('suggestions')
export class SuggestionsController {
  constructor(
    private readonly suggestionService: SuggestionApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get()
  async listSuggestions(@Query('status') status?: string) {
    if (status && status !== 'pending') {
      return { data: [] };
    }

    const data = unwrapResult(
      await this.suggestionService.listPending(
        this.tenantContext.getTenantId(),
      ),
    );
    return { data };
  }

  @Post(':id/accept')
  async acceptSuggestion(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(acceptSuggestionBodySchema))
    body: { assigneeId?: string },
  ) {
    const data = unwrapResult(
      await this.suggestionService.acceptSuggestion(
        this.tenantContext.getTenantId(),
        id,
        body,
      ),
    );
    return { data };
  }

  @Post(':id/dismiss')
  async dismissSuggestion(@Param('id') id: string) {
    const data = unwrapResult(
      await this.suggestionService.dismissSuggestion(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }
}
