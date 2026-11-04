import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { success } from '../../../shared/application/result';
import type { AuthTokensDto } from '../application/dtos/auth.dto';
import type { AuthApplicationService } from '../application/services/auth.application.service';
import type { PasswordChangeService } from '../application/services/password-change.service';
import { AuthController } from './auth.controller';

/**
 * R1-07 (docs/14 §Session Management: "HTTP-only, Secure, SameSite=Strict")
 * — the refresh-token cookie is HttpOnly unconditionally, and Secure/
 * SameSite=Strict only in staging/production (docs/16 §Environment
 * Variables); local development/test get relaxed values (`secure: false`,
 * `sameSite: 'lax'`) so refresh flows keep working over plain HTTP.
 */
describe('AuthController — refresh-token cookie flags (R1-07)', () => {
  const tokens: AuthTokensDto = {
    accessToken: 'access-token',
    expiresIn: 900,
    refreshToken: 'session-1.raw-refresh-token',
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user: {
      id: 'user-1',
      email: 'owner@wedecor.test',
      name: 'Owner',
      role: 'owner',
    },
  };

  function buildController(nodeEnv: string) {
    const authService = {
      login: jest.fn().mockResolvedValue(success(tokens)),
      refresh: jest.fn().mockResolvedValue(success(tokens)),
      logout: jest.fn().mockResolvedValue(success({ success: true as const })),
    } as unknown as AuthApplicationService;

    const passwordChangeService = {
      changePassword: jest
        .fn()
        .mockResolvedValue(success({ success: true as const })),
    } as unknown as PasswordChangeService;

    const configService = {
      get: jest.fn().mockReturnValue(nodeEnv),
    } as unknown as ConfigService;

    const controller = new AuthController(
      authService,
      passwordChangeService,
      configService as ConfigService<never, true>,
    );

    return { controller, authService };
  }

  function mockResponse(): jest.Mocked<Response> {
    return {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as jest.Mocked<Response>;
  }

  const fakeReq = { cookies: {} } as unknown as Request;

  it.each(['development', 'test'])(
    'sets HttpOnly + relaxed (non-Secure, SameSite=Lax) cookie flags on login in NODE_ENV=%s',
    async (nodeEnv) => {
      const { controller } = buildController(nodeEnv);
      const res = mockResponse();

      await controller.login(
        'tenant-1',
        { email: 'owner@wedecor.test', password: 'hunter2' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/api/v1/auth',
        }),
      );
    },
  );

  it.each(['staging', 'production'])(
    'sets HttpOnly + strict (Secure, SameSite=Strict) cookie flags on login in NODE_ENV=%s',
    async (nodeEnv) => {
      const { controller } = buildController(nodeEnv);
      const res = mockResponse();

      await controller.login(
        'tenant-1',
        { email: 'owner@wedecor.test', password: 'hunter2' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/api/v1/auth',
        }),
      );
    },
  );

  it('clears the cookie with the same relaxed flags on logout in development', async () => {
    const { controller } = buildController('development');
    const res = mockResponse();

    await controller.logout('tenant-1', fakeReq, {}, res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      }),
    );
  });

  it('clears the cookie with the same strict flags on logout in production', async () => {
    const { controller } = buildController('production');
    const res = mockResponse();

    await controller.logout('tenant-1', fakeReq, {}, res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      }),
    );
  });

  it('does not change access-token content when relaxing refresh-cookie flags', async () => {
    const { controller } = buildController('development');
    const res = mockResponse();

    const response = await controller.login(
      'tenant-1',
      { email: 'owner@wedecor.test', password: 'hunter2' },
      res,
    );

    expect(response).toEqual({
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        user: tokens.user,
      },
    });
  });
});
