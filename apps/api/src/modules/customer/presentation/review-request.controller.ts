import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { ReviewRequestApplicationService } from '../application/services/review-request.application.service';
import {
  createReviewRequestSchema,
  type CreateReviewRequestBody,
} from './schemas/review-request.schemas';

// docs/09 §Customer — POST /api/v1/events/:eventId/review-requests (R3-07 / EP1-CUS-003).
@ApiTags('Customer Review Requests')
@ApiBearerAuth()
@Controller('events/:eventId/review-requests')
export class ReviewRequestController {
  constructor(
    private readonly reviewRequestService: ReviewRequestApplicationService,
  ) {}

  @Post()
  @Permissions('reviews:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review request for an event' })
  @ApiUuidParam('eventId')
  @ApiZodBody(createReviewRequestSchema)
  @ApiDataResponse(201, 'Review request created')
  @ApiStandardErrors()
  async createReviewRequest(
    @TenantId() tenantId: string,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(createReviewRequestSchema))
    body: CreateReviewRequestBody,
  ) {
    const result = await this.reviewRequestService.createReviewRequest(
      tenantId,
      eventId,
      {
        channel: body.channel,
        channelDetail: body.channelDetail,
      },
    );
    return resultToResponse(result);
  }
}
