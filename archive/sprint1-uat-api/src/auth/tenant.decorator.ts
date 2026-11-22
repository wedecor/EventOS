import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant.context';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ tenantContext?: TenantContext }>();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new Error('TenantContext middleware is not configured.');
    }

    return tenantContext.getTenantId();
  },
);
