import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../modules/auth';
import {
  ApiDataResponse,
  ApiStandardErrors,
} from '../../shared/presentation/openapi.helpers';
import { HealthService } from './health.service';

// Infrastructure liveness/readiness probes are unauthenticated so orchestrators
// can reach them without credentials (exempt from the global JwtAuthGuard).
@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness probe — application is running',
    security: [],
  })
  @ApiDataResponse(200, 'Application is running')
  @ApiStandardErrors()
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Readiness probe — PostgreSQL and Redis connectivity (503 when degraded)',
    security: [],
  })
  @ApiDataResponse(200, 'Dependency readiness status')
  @ApiStandardErrors()
  async readiness(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.readiness();
    // P2-13 — orchestrators must not route traffic when dependencies are down.
    if (result.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
