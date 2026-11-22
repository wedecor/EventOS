import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { EnvConfig } from '../../../config';
import { success, type Result } from '../../../shared/application/result';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import type { AuthTokensDto, AuthUserDto } from '../application/dtos/auth.dto';
import { AuthApplicationService } from '../application/services/auth.application.service';
import { PasswordChangeService } from '../application/services/password-change.service';
import type { AuthenticatedUser } from '../domain/authenticated-user';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  type ChangePasswordBody,
  type LoginBody,
  type RefreshBody,
} from './schemas/auth.schemas';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

type AuthResponseBody = {
  accessToken: string;
  expiresIn: number;
  user: AuthUserDto;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthApplicationService,
    private readonly passwordChangeService: PasswordChangeService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with email and password',
    security: [],
  })
  @ApiZodBody(loginSchema)
  @ApiDataResponse(
    200,
    'Authenticated; access token returned; refresh token set as HTTP-only cookie',
  )
  @ApiStandardErrors()
  async login(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(loginSchema)) body: LoginBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(tenantId, body);
    return this.respondWithTokens(result, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new access token',
    description:
      'Accepts the refresh token from the HTTP-only `refresh_token` cookie (preferred) or from the request body. On success, rotates the cookie and returns a new access token.',
    security: [],
  })
  @ApiZodBody(refreshSchema)
  @ApiDataResponse(
    200,
    'Tokens refreshed; new access token returned; refresh cookie rotated',
  )
  @ApiStandardErrors()
  async refresh(
    @TenantId() tenantId: string,
    @Req() req: Request,
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.extractRefreshToken(req, body);
    const result = await this.authService.refresh(tenantId, refreshToken ?? '');
    return this.respondWithTokens(result, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  @ApiZodBody(refreshSchema)
  @ApiDataResponse(200, 'Refresh token revoked; cookie cleared')
  @ApiStandardErrors()
  async logout(
    @TenantId() tenantId: string,
    @Req() req: Request,
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.extractRefreshToken(req, body);
    const result = await this.authService.logout(tenantId, refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return resultToResponse(result);
  }

  // R1-10 — authenticated self-service password change (docs/14 §Password
  // Requirements). No @Public and no @Permissions: any authenticated user may change
  // their own password. Complexity/history/breach rules live in the Application layer.
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated user\u2019s password' })
  @ApiZodBody(changePasswordSchema)
  @ApiDataResponse(200, 'Password changed successfully')
  @ApiStandardErrors()
  async changePassword(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordBody,
  ) {
    const result = await this.passwordChangeService.changePassword(
      tenantId,
      user.userId,
      {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    );
    return resultToResponse(result);
  }

  private respondWithTokens(
    result: Result<AuthTokensDto>,
    res: Response,
  ): { data: AuthResponseBody } {
    if (result.ok) {
      this.setRefreshCookie(
        res,
        result.value.refreshToken,
        result.value.refreshTokenExpiresAt,
      );
    }

    // Never return the refresh token in the JSON body — it lives only in the
    // HTTP-only cookie (ADR-008). On failure this passes the error through so
    // resultToResponse maps it to the correct status.
    const bodyResult: Result<AuthResponseBody> = result.ok
      ? success({
          accessToken: result.value.accessToken,
          expiresIn: result.value.expiresIn,
          user: result.value.user,
        })
      : result;

    return resultToResponse(bodyResult);
  }

  private extractRefreshToken(req: Request, body: RefreshBody): string | null {
    if (body.refreshToken) {
      return body.refreshToken;
    }
    const cookies = req.cookies as Record<string, string> | undefined;
    return cookies?.[REFRESH_COOKIE_NAME] ?? null;
  }

  private setRefreshCookie(
    res: Response,
    refreshToken: string,
    expiresAt: Date,
  ): void {
    const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.cookieOptions(),
      maxAge,
    });
  }

  private cookieOptions(): CookieOptions {
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    // docs/14 §Session Management: HTTP-only, Secure, SameSite=Strict
    // refresh-token cookie. Secure and SameSite=Strict both assume the app is
    // served over HTTPS on a single site — true for staging/production
    // (docs/16 §Environment Variables), but not for local development, which
    // is plain HTTP and, per docs/22 onboarding, commonly split across
    // different localhost ports for the frontend/API. R1-07 keeps HttpOnly
    // unconditional (it never depends on transport) and relaxes Secure/
    // SameSite to values that still work over local HTTP (`lax` still blocks
    // genuine cross-site requests, unlike `none`).
    const isDeployedTier = nodeEnv === 'production' || nodeEnv === 'staging';
    return {
      httpOnly: true,
      secure: isDeployedTier,
      sameSite: isDeployedTier ? 'strict' : 'lax',
      path: REFRESH_COOKIE_PATH,
    };
  }
}
