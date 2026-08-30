import { Injectable } from '@nestjs/common';

import { InvalidCredentialsError } from '../../../common/errors/auth.error.js';
import { type LoginInput } from '../dto/auth.dto.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import { UsersRepository } from '../domain/users.repository.js';
import { type AuthSession, SessionIssuer } from './session-issuer.js';

/**
 * Hash descartável, usado quando o e-mail não existe.
 *
 * Verificar um hash falso custa o mesmo que verificar um real — sem isso, o
 * tempo de resposta denunciaria quais e-mails têm conta, mesmo com a mensagem
 * de erro sendo idêntica.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: LoginInput, ipAddress?: string): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);

    const matches = await this.hasher.verify(user?.passwordHash ?? DUMMY_HASH, input.password);

    if (!user || !matches) {
      throw new InvalidCredentialsError();
    }

    return this.sessions.issue(user, {
      deviceName: input.deviceName,
      ipAddress,
    });
  }
}
