import { Injectable } from '@nestjs/common';

import { SessionsRepository } from '../../auth/domain/sessions.repository.js';
import { UsersRepository } from '../../auth/domain/users.repository.js';

/** Prazo de arrependimento antes do expurgo definitivo. */
export const DELETION_GRACE_PERIOD_DAYS = 30;

/**
 * Agenda a exclusão da conta em vez de apagar na hora.
 *
 * A conta e os dados sobrevivem por 30 dias, tempo em que o usuário pode
 * cancelar. Exclusão imediata seria mais simples de implementar e irreversível
 * para quem clicou por engano.
 */
@Injectable()
export class ScheduleAccountDeletionUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionsRepository,
  ) {}

  async execute(userId: string): Promise<{ scheduledAt: Date }> {
    const scheduledAt = new Date(Date.now() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    await this.users.scheduleDeletion(userId, scheduledAt);

    // Encerra as sessões: a conta está a caminho de deixar de existir.
    await this.sessions.revokeAllForUser(userId, new Date());

    return { scheduledAt };
  }
}
