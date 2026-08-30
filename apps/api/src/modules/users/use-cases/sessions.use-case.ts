import { Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../common/errors/domain.error.js';
import { SessionsRepository } from '../../auth/domain/sessions.repository.js';

export interface SessionView {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  current: boolean;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class ListSessionsUseCase {
  constructor(private readonly sessions: SessionsRepository) {}

  async execute(userId: string): Promise<SessionView[]> {
    const sessions = await this.sessions.findActiveByUser(userId);

    return sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      // Marcar a sessão atual exigiria correlacionar o access token com ela;
      // fica para quando o access token carregar o id da sessão.
      current: false,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }
}

@Injectable()
export class RevokeSessionUseCase {
  constructor(private readonly sessions: SessionsRepository) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessions.findById(sessionId);

    // Sessão de outro usuário responde 404, não 403: um 403 confirmaria que a
    // sessão existe. Ver docs/architecture/security.md.
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Sessão não encontrada');
    }

    await this.sessions.revoke(sessionId, new Date());
  }
}
