import { Injectable, Logger } from '@nestjs/common';

import {
  InvalidRefreshTokenError,
  RefreshTokenReusedError,
} from '../../../common/errors/auth.error.js';
import { SessionsRepository } from '../domain/sessions.repository.js';
import { TokenService } from '../domain/token.service.js';
import { UsersRepository } from '../domain/users.repository.js';
import { type AuthSession, SessionIssuer } from './session-issuer.js';

/**
 * Janela de tolerância para renovações concorrentes.
 *
 * Dois requests do mesmo cliente podem renovar ao mesmo tempo — um retry de
 * rede, duas abas, o app voltando do background. Sem esta janela, o segundo
 * seria lido como roubo de token e derrubaria todas as sessões do usuário sem
 * motivo. Ver docs/architecture/security.md.
 */
const CONCURRENT_REFRESH_GRACE_MS = 10_000;

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly sessions: SessionsRepository,
    private readonly users: UsersRepository,
    private readonly tokens: TokenService,
    private readonly issuer: SessionIssuer,
  ) {}

  async execute(refreshToken: string, ipAddress?: string): Promise<AuthSession> {
    const hash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);

    if (!session) {
      throw new InvalidRefreshTokenError();
    }

    if (session.revokedAt) {
      await this.handleRevokedSession(session.userId, session.revokedAt);
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    // Rotação: o token apresentado morre aqui. Um novo par é emitido.
    await this.sessions.revoke(session.id, new Date());

    return this.issuer.issue(user, {
      deviceName: session.deviceName ?? undefined,
      ipAddress: ipAddress ?? session.ipAddress ?? undefined,
    });
  }

  private async handleRevokedSession(userId: string, revokedAt: Date): Promise<void> {
    const elapsed = Date.now() - revokedAt.getTime();

    if (elapsed <= CONCURRENT_REFRESH_GRACE_MS) {
      // Corrida de rede, não roubo: recusa esta renovação sem punir o usuário.
      // O par emitido pela requisição vencedora continua válido.
      throw new InvalidRefreshTokenError();
    }

    // Fora da janela, o reuso só tem uma explicação plausível: o token vazou.
    // Derrubamos tudo — o custo de errar para este lado é um novo login.
    const revoked = await this.sessions.revokeAllForUser(userId, new Date());
    this.logger.warn(
      `Reuso de refresh token detectado para o usuário ${userId}. ` +
        `${revoked} sessão(ões) revogada(s).`,
    );

    throw new RefreshTokenReusedError();
  }
}
