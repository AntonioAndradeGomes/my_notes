import { Injectable } from '@nestjs/common';

import { SessionsRepository } from '../domain/sessions.repository.js';
import { TokenService } from '../domain/token.service.js';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(userId: string, refreshToken: string, allDevices: boolean): Promise<void> {
    const now = new Date();

    if (allDevices) {
      await this.sessions.revokeAllForUser(userId, now);
      return;
    }

    const session = await this.sessions.findByRefreshTokenHash(
      this.tokens.hashRefreshToken(refreshToken),
    );

    // Sair de uma sessão que já não existe não é erro: o resultado desejado
    // pelo cliente — não estar mais autenticado — já é o caso.
    if (session && session.userId === userId) {
      await this.sessions.revoke(session.id, now);
    }
  }
}
