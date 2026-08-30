import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';

import { TokenService } from '../../modules/auth/domain/token.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { TokenExpiredError, UnauthenticatedError } from '../errors/auth.error.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Valida o access token e popula `request.user`.
 *
 * Registrado globalmente via `APP_GUARD`: rota nova é protegida por padrão, e
 * abrir uma exige o `@Public()` explícito.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthenticatedError('Token de acesso ausente');
    }

    try {
      const payload = await this.tokens.verifyAccessToken(token);
      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch (error) {
      // Distinguir expirado de inválido importa para o cliente: no primeiro
      // caso ele renova e repete; no segundo, descarta a sessão.
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new TokenExpiredError();
      }
      throw new UnauthenticatedError('Token de acesso inválido');
    }
  }
}

function extractBearerToken(request: Request): string | null {
  const header = request.header('authorization');
  if (!header) return null;

  const [scheme, value] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && value ? value : null;
}
