import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config';
import { PHASE1_TENANT_ID } from '../../../shared/tenant/phase1-tenant';
import { EnquiriesFeedConfig } from '../application/ports/enquiries-feed.config';

@Injectable()
export class ConfigEnquiriesFeedConfig extends EnquiriesFeedConfig {
  readonly secrets: readonly string[];
  readonly tenantId: string;

  constructor(configService: ConfigService<EnvConfig, true>) {
    super();
    this.secrets = [
      configService.get('ENQUIRIES_FEED_SECRET', { infer: true }),
      configService.get('ENQUIRIES_FEED_SECRET_NEXT', { infer: true }),
    ].filter((secret): secret is string => Boolean(secret));
    // Required in staging/production (env schema); local/test fall back to the
    // single Phase 1 tenant (ADR-016). Never read from a request.
    this.tenantId =
      configService.get('ENQUIRIES_FEED_TENANT_ID', { infer: true }) ??
      PHASE1_TENANT_ID;
  }
}
