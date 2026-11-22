import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { unwrapResult } from '../common/http/result-http';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestWithAuth } from './api-auth.guard';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from './auth-cookies';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { loginBodySchema } from './schemas/login.schema';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginBodySchema))
    body: {
      email: string;
      password: string;
      tenantSlug?: string;
    },
    @Res({ passthrough: true }) response: Response,
  ) {
    const login = unwrapResult(await this.authService.login(body));
    setRefreshTokenCookie(response, login.refreshToken, login.refreshMaxAgeMs);

    return {
      data: {
        accessToken: login.accessToken,
        expiresIn: login.expiresIn,
        tokenType: login.tokenType,
      },
    };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME] as
      string | undefined;

    const login = unwrapResult(await this.authService.refresh(cookieToken));
    setRefreshTokenCookie(response, login.refreshToken, login.refreshMaxAgeMs);

    return {
      data: {
        accessToken: login.accessToken,
        expiresIn: login.expiresIn,
        tokenType: login.tokenType,
      },
    };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME] as
      string | undefined;

    const data = unwrapResult(await this.authService.logout(cookieToken));
    clearRefreshTokenCookie(response);
    return { data };
  }

  @Get('me')
  async me(@Req() request: RequestWithAuth) {
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Bearer token required for profile.',
      });
    }

    const data = unwrapResult(
      await this.authService.getProfile(user.tenantId, user.sub),
    );
    return { data };
  }
}
