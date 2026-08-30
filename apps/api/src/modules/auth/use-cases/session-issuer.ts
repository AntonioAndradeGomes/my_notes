import { Injectable } from '@nestjs/common';

import { SessionsRepository } from '../domain/sessions.repository.js';
import { TokenService } from '../domain/token.service.js';
import { type PublicUser, toPublicUser, type User } from '../domain/user.entity.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthSession {
  user: PublicUser;
  tokens: TokenPair;
}

export interface IssueContext {
  deviceName?: string | undefined;
  ipAddress?: string | undefined;
}

/**
 * Cria uma sessão e emite o par de tokens.
 *
 * Existe como peça própria porque três fluxos precisam exatamente disto —
 * cadastro, login e renovação. Duplicar a emissão em cada um deles seria a
 * forma mais fácil de fazer os três divergirem com o tempo.
 */
@Injectable()
export class SessionIssuer {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly tokens: TokenService,
  ) {}

  async issue(user: User, context: IssueContext = {}): Promise<AuthSession> {
    const refresh = this.tokens.issueRefreshToken();

    await this.sessions.create({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      deviceName: context.deviceName,
      ipAddress: context.ipAddress,
      expiresAt: this.tokens.refreshTokenExpiresAt(),
    });

    const accessToken = await this.tokens.signAccessToken({ sub: user.id, email: user.email });

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken: refresh.token,
        tokenType: 'Bearer',
        expiresIn: this.tokens.accessTokenTtlSeconds(),
      },
    };
  }
}
