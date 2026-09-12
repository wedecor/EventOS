import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe — application is running' })
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — PostgreSQL and Redis connectivity',
  })
  async readiness() {
    return this.healthService.readiness();
  }
}
