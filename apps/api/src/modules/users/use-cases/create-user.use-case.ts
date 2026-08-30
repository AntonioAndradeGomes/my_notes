import { Injectable } from '@nestjs/common';

import { PasswordHasher } from '../../auth/domain/password-hasher.js';
import { type PublicUser, toPublicUser } from '../../auth/domain/user.entity.js';
import { UsersRepository } from '../../auth/domain/users.repository.js';
import { type CreateUserInput } from '../dto/users.dto.js';

/**
 * Cria a conta — e só isso.
 *
 * Não emite tokens de propósito: cadastrar não autentica. Depois de criar a
 * conta o cliente é redirecionado para o login, que é o único lugar onde
 * credenciais viram sessão. Isso mantém uma porta de entrada só para
 * autenticação, em vez de duas com regras a manter em sincronia.
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<PublicUser> {
    const passwordHash = await this.hasher.hash(input.password);

    // E-mail duplicado vira AlreadyExistsError no repositório, a partir da
    // violação de unicidade — sem SELECT prévio, sem janela de corrida.
    const user = await this.users.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    return toPublicUser(user);
  }
}
