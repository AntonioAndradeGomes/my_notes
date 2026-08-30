import { Injectable } from '@nestjs/common';

import { InvalidCredentialsError } from '../../../common/errors/auth.error.js';
import { NotFoundError } from '../../../common/errors/domain.error.js';
import { PasswordHasher } from '../../auth/domain/password-hasher.js';
import { SessionsRepository } from '../../auth/domain/sessions.repository.js';
import { UsersRepository } from '../../auth/domain/users.repository.js';
import { type ChangePasswordInput } from '../dto/users.dto.js';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionsRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Exigir a senha atual impede que um access token roubado, sozinho, tome a
    // conta: quem tem só o token não sabe a senha.
    if (!(await this.hasher.verify(user.passwordHash, input.currentPassword))) {
      throw new InvalidCredentialsError();
    }

    await this.users.updatePasswordHash(userId, await this.hasher.hash(input.newPassword));

    // Troca de senha derruba todas as sessões: é a ação que o usuário toma
    // justamente quando suspeita que alguém tem acesso à conta.
    await this.sessions.revokeAllForUser(userId, new Date());
  }
}
