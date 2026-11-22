import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
  ApiZodQuery,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { SuggestionApplicationService } from '../application/services/suggestion.application.service';
import {
  acceptSuggestionSchema,
  dismissSuggestionSchema,
  listSuggestionsQuerySchema,
  type AcceptSuggestionBody,
  type DismissSuggestionBody,
  type ListSuggestionsQuery,
} from './schemas/suggestion.schemas';

// Base path matches `docs/09-api-design.md` §Module: Administration — Suggestions.
@ApiTags('Suggestions')
@ApiBearerAuth()
@Controller('suggestions')
export class SuggestionController {
  constructor(
    private readonly suggestionService: SuggestionApplicationService,
  ) {}

  // EP1-AUT-001 — List suggestions (default status=pending per docs/09)
  @Get()
  @Permissions('suggestions:read')
  @ApiOperation({ summary: 'List suggestions' })
  @ApiZodQuery('status', listSuggestionsQuerySchema.shape.status, {
    required: false,
  })
  @ApiDataResponse(200, 'Suggestions listed')
  @ApiStandardErrors()
  async listSuggestions(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listSuggestionsQuerySchema))
    query: ListSuggestionsQuery,
  ) {
    const result = await this.suggestionService.listSuggestions(tenantId, {
      status: query.status,
    });
    return resultToResponse(result);
  }

  // EP1-AUT-001 / ADR-017 — Accept a pending suggestion (human confirmation)
  @Post(':id/accept')
  @Permissions('suggestions:accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a pending suggestion' })
  @ApiUuidParam('id')
  @ApiZodBody(acceptSuggestionSchema)
  @ApiDataResponse(200, 'Suggestion accepted')
  @ApiStandardErrors()
  async acceptSuggestion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(acceptSuggestionSchema))
    body: AcceptSuggestionBody,
  ) {
    const result = await this.suggestionService.acceptSuggestion(tenantId, id, {
      comment: body.comment,
      actorUserId: user.userId,
      actorRole: user.role,
    });
    return resultToResponse(result);
  }

  // EP1-AUT-001 / ADR-017 — Dismiss a pending suggestion
  @Post(':id/dismiss')
  @Permissions('suggestions:dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a pending suggestion' })
  @ApiUuidParam('id')
  @ApiZodBody(dismissSuggestionSchema)
  @ApiDataResponse(200, 'Suggestion dismissed')
  @ApiStandardErrors()
  async dismissSuggestion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(dismissSuggestionSchema))
    body: DismissSuggestionBody,
  ) {
    const result = await this.suggestionService.dismissSuggestion(
      tenantId,
      id,
      {
        comment: body.comment,
        actorUserId: user.userId,
        actorRole: user.role,
      },
    );
    return resultToResponse(result);
  }
}
