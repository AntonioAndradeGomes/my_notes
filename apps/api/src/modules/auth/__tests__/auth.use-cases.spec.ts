import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RefreshTokenReusedError,
} from '../../../common/errors/auth.error.js';
import { type Env } from '../../../config/env.schema.js';
import { TokenService } from '../domain/token.service.js';
import { LoginUseCase } from '../use-cases/login.use-case.js';
import { RefreshTokenUseCase } from '../use-cases/refresh-token.use-case.js';
import { SessionIssuer } from '../use-cases/session-issuer.js';
import {
  FakePasswordHasher,
  InMemorySessionsRepository,
  InMemoryUsersRepository,
} from '../../../../test/support/in-memory-repositories.js';

const env: Partial<Env> = {
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_REFRESH_TTL: '30d',
};

function build() {
  const users = new InMemoryUsersRepository();
  const sessions = new InMemorySessionsRepository();
  const hasher = new FakePasswordHasher();

  const config = {
    get: (key: keyof Env) => env[key],
  } as unknown as ConfigService<Env, true>;

  const tokens = new TokenService(new JwtService(), config);
  const issuer = new SessionIssuer(sessions, tokens);

  return {
    users,
    sessions,
    hasher,
    issuer,
    tokens,
    login: new LoginUseCase(users, hasher, issuer),
    refresh: new RefreshTokenUseCase(sessions, users, tokens, issuer),
  };
}

/** Cria a conta direto no repositório: o cadastro não é mais função do auth. */
async function seedAccount(
  users: InMemoryUsersRepository,
  hasher: FakePasswordHasher,
): Promise<void> {
  await users.create({
    name: credentials.name,
    email: credentials.email,
    passwordHash: await hasher.hash(credentials.password),
  });
}

const credentials = {
  name: 'Fulano da Silva',
  email: 'fulano@exemplo.com',
  password: 'uma-senha-bem-longa',
};

describe('LoginUseCase', () => {
  it('autentica com as credenciais corretas', async () => {
    const { users, hasher, login } = build();
    await seedAccount(users, hasher);

    const result = await login.execute({
      email: credentials.email,
      password: credentials.password,
    });

    expect(result.user.email).toBe(credentials.email);
  });

  it('responde igual para senha errada e para e-mail inexistente', async () => {
    const { users, hasher, login } = build();
    await seedAccount(users, hasher);

    const wrongPassword = login.execute({ email: credentials.email, password: 'errada-errada' });
    const unknownEmail = login.execute({ email: 'ninguem@exemplo.com', password: 'errada-errada' });

    await expect(wrongPassword).rejects.toThrow(InvalidCredentialsError);
    await expect(unknownEmail).rejects.toThrow(InvalidCredentialsError);
  });
});

describe('RefreshTokenUseCase', () => {
  it('rotaciona o par: o token apresentado deixa de valer', async () => {
    const { users, hasher, login, refresh, sessions } = build();
    await seedAccount(users, hasher);
    const first = await login.execute({ email: credentials.email, password: credentials.password });

    const second = await refresh.execute(first.tokens.refreshToken);

    expect(second.tokens.refreshToken).not.toBe(first.tokens.refreshToken);
    expect(sessions.sessions).toHaveLength(2);
    expect(sessions.sessions[0]?.revokedAt).not.toBeNull();
  });

  it('revoga TODAS as sessões quando um token já consumido é reapresentado', async () => {
    const { users, hasher, login, refresh, sessions } = build();
    await seedAccount(users, hasher);
    const first = await login.execute({ email: credentials.email, password: credentials.password });
    await refresh.execute(first.tokens.refreshToken);

    // Coloca a revogação fora da janela de tolerância a corridas.
    const revoked = sessions.sessions[0];
    if (revoked) revoked.revokedAt = new Date(Date.now() - 60_000);

    await expect(refresh.execute(first.tokens.refreshToken)).rejects.toThrow(
      RefreshTokenReusedError,
    );
    expect(sessions.sessions.every((session) => session.revokedAt !== null)).toBe(true);
  });

  it('trata renovação concorrente como corrida, não como roubo', async () => {
    const { users, hasher, login, refresh, sessions } = build();
    await seedAccount(users, hasher);
    const first = await login.execute({ email: credentials.email, password: credentials.password });
    await refresh.execute(first.tokens.refreshToken);

    // Dentro da janela: recusa a renovação, mas não derruba o usuário.
    await expect(refresh.execute(first.tokens.refreshToken)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
    const active = await sessions.findActiveByUser(first.user.id);
    expect(active).toHaveLength(1);
  });

  it('rejeita refresh token desconhecido', async () => {
    const { refresh } = build();

    await expect(refresh.execute('token-inventado')).rejects.toThrow(InvalidRefreshTokenError);
  });
});
