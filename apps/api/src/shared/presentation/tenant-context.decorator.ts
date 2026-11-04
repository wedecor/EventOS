import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { PHASE1_TENANT_ID } from '../tenant/phase1-tenant';

/**
 * Phase 1 (ADR-016): Returns a hardcoded tenant ID for the "We Decor" seed tenant.
 * Multi-tenant SaaS (JWT-based tenant resolution) is explicitly out of Phase 1 scope
 * per ADR-016 and `docs/business/19-event-os-phase1-requirements.md`.
 *
 * The id is sourced from the shared {@link PHASE1_TENANT_ID} constant so it stays in
 * lockstep with the Prisma seed (see `prisma/seed.ts`).
 */
export const TenantId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string => {
    return PHASE1_TENANT_ID;
  },
);
