import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  type LoginInput,
  loginSchema,
  type LogoutInput,
  logoutSchema,
  type RefreshInput,
  refreshSchema,
} from './dto/auth.dto.js';
import { LoginUseCase } from './use-cases/login.use-case.js';
import { LogoutUseCase } from './use-cases/logout.use-case.js';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case.js';
import { type AuthSession, type TokenPair } from './use-cases/session-issuer.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Ip() ip: string,
  ): Promise<AuthSession> {
    return this.login.execute(body, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async renew(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput,
    @Ip() ip: string,
  ): Promise<TokenPair> {
    const session = await this.refresh.execute(body.refreshToken, ip);
    return session.tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(logoutSchema)) body: LogoutInput,
  ): Promise<void> {
    await this.logout.execute(userId, body.refreshToken, body.allDevices);
  }
}
