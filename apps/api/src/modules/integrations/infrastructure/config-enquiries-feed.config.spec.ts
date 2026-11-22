import type { ConfigService } from '@nestjs/config';
import { PHASE1_TENANT_ID } from '../../../shared/tenant/phase1-tenant';
import { ConfigEnquiriesFeedConfig } from './config-enquiries-feed.config';

function config(values: Record<string, string | undefined>) {
  return new ConfigEnquiriesFeedConfig({
    get: (key: string) => values[key],
  } as unknown as ConfigService<never, true>);
}

describe('ConfigEnquiriesFeedConfig (M5-01)', () => {
  it('lists the primary secret first, then the rotation secret', () => {
    const feed = config({
      ENQUIRIES_FEED_SECRET: 'primary',
      ENQUIRIES_FEED_SECRET_NEXT: 'next',
    });

    expect(feed.secrets).toEqual(['primary', 'next']);
  });

  it('omits unset secrets', () => {
    expect(config({ ENQUIRIES_FEED_SECRET_NEXT: 'next' }).secrets).toEqual([
      'next',
    ]);
    expect(config({}).secrets).toEqual([]);
  });

  it('takes the tenant from config, falling back to the Phase 1 tenant locally', () => {
    expect(config({ ENQUIRIES_FEED_TENANT_ID: 'tenant-x' }).tenantId).toBe(
      'tenant-x',
    );
    expect(config({}).tenantId).toBe(PHASE1_TENANT_ID);
  });
});
