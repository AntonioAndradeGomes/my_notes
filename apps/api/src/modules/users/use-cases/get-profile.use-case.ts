import { Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../common/errors/domain.error.js';
import { type PublicUser, toPublicUser } from '../../auth/domain/user.entity.js';
import { UsersRepository } from '../../auth/domain/users.repository.js';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      // Token válido de conta já removida.
      throw new NotFoundError('Usuário não encontrado');
    }

    return toPublicUser(user);
  }
}
