import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Phase 1 (ADR-016): Returns a hardcoded tenant ID for the "We Decor" seed tenant.
 * Multi-tenant SaaS (JWT-based tenant resolution) is explicitly out of Phase 1 scope
 * per ADR-016 and `docs/business/19-event-os-phase1-requirements.md`.
 */
const PHASE1_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const TenantId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string => {
    return PHASE1_TENANT_ID;
  },
);
