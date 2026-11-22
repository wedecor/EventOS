import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { failure, success } from '../../../shared/application/result';
import type { AuthTokensDto } from '../application/dtos/auth.dto';
import type { AuthApplicationService } from '../application/services/auth.application.service';
import type { FirebaseExchangeApplicationService } from '../application/services/firebase-exchange.application.service';
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

    const firebaseExchangeService = {
      exchange: jest.fn().mockImplementation((_tenantId: string, input) =>
        Promise.resolve(
          success({
            tokens: {
              ...tokens,
              user: { ...tokens.user, permissions: ['bookings:read'] },
            },
            includeRefreshTokenInBody: input.client === 'mobile',
          }),
        ),
      ),
    } as unknown as jest.Mocked<FirebaseExchangeApplicationService>;

    const controller = new AuthController(
      authService,
      passwordChangeService,
      configService as ConfigService<never, true>,
      firebaseExchangeService,
    );

    return { controller, authService, firebaseExchangeService };
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

  describe('POST /auth/firebase/exchange (M5-01)', () => {
    const exchangeReq = {
      ip: '203.0.113.5',
      headers: { 'user-agent': 'EnquiriesApp/1.0' },
      cookies: {},
    } as unknown as Request;

    it('returns the refresh token in the body for mobile clients and still sets the cookie', async () => {
      const { controller, firebaseExchangeService } =
        buildController('production');
      const res = mockResponse();

      const response = await controller.firebaseExchange(
        'tenant-1',
        exchangeReq,
        { idToken: 'id-token', client: 'mobile' },
        res,
      );

      expect(response.data.refreshToken).toBe(tokens.refreshToken);
      expect(response.data.accessToken).toBe(tokens.accessToken);
      expect(response.data.user.permissions).toEqual(['bookings:read']);
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(firebaseExchangeService.exchange).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          idToken: 'id-token',
          client: 'mobile',
          ipAddress: '203.0.113.5',
          userAgent: 'EnquiriesApp/1.0',
        }),
      );
    });

    it('keeps the refresh token out of the body for web clients', async () => {
      const { controller } = buildController('production');
      const res = mockResponse();

      const response = await controller.firebaseExchange(
        'tenant-1',
        exchangeReq,
        { idToken: 'id-token', client: 'web' },
        res,
      );

      expect(response.data).not.toHaveProperty('refreshToken');
      expect(res.cookie).toHaveBeenCalled();
    });

    it('passes failures through without setting a cookie', async () => {
      const { controller, firebaseExchangeService } =
        buildController('production');
      (firebaseExchangeService.exchange as jest.Mock).mockResolvedValue(
        failure('IDENTITY_NOT_LINKED', 'not linked'),
      );
      const res = mockResponse();

      await expect(
        controller.firebaseExchange(
          'tenant-1',
          exchangeReq,
          { idToken: 'id-token' },
          res,
        ),
      ).rejects.toMatchObject({ status: 403 });
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
