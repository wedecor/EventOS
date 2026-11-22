import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

function executionContext(): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: JwtAuthGuard;
  // Base AuthGuard('jwt') mixin sits one prototype above JwtAuthGuard.
  const baseCanActivate = jest.spyOn(
    Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: (context: ExecutionContext) => boolean;
    },
    'canActivate',
  );

  beforeEach(() => {
    baseCanActivate.mockReset();
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  afterAll(() => {
    baseCanActivate.mockRestore();
  });

  it('allows public routes without invoking passport authentication', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    baseCanActivate.mockReturnValue(true);

    const result = guard.canActivate(executionContext());

    expect(result).toBe(true);
    expect(baseCanActivate).not.toHaveBeenCalled();
  });

  it('delegates to passport JWT authentication for protected routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    baseCanActivate.mockReturnValue(true);

    const result = guard.canActivate(executionContext());

    expect(baseCanActivate).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('treats a route with no @Public metadata as protected', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    baseCanActivate.mockReturnValue(false);

    const result = guard.canActivate(executionContext());

    expect(baseCanActivate).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });
});
