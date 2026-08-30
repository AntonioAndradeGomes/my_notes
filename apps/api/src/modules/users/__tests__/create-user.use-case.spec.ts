import {
  FakePasswordHasher,
  InMemoryUsersRepository,
} from '../../../../test/support/in-memory-repositories.js';
import { AlreadyExistsError } from '../../../common/errors/domain.error.js';
import { CreateUserUseCase } from '../use-cases/create-user.use-case.js';

const input = {
  name: 'Fulano da Silva',
  email: 'fulano@exemplo.com',
  password: 'uma-senha-bem-longa',
};

function build() {
  const users = new InMemoryUsersRepository();
  const hasher = new FakePasswordHasher();
  return { users, hasher, createUser: new CreateUserUseCase(users, hasher) };
}

describe('CreateUserUseCase', () => {
  it('cria a conta e devolve o perfil público', async () => {
    const { createUser, users } = build();

    const user = await createUser.execute(input);

    expect(user).toMatchObject({ email: input.email, name: input.name });
    expect(users.users).toHaveLength(1);
  });

  it('NÃO emite tokens: cadastrar não autentica', async () => {
    const { createUser } = build();

    const user = await createUser.execute(input);

    expect(user).not.toHaveProperty('tokens');
    expect(user).not.toHaveProperty('accessToken');
    expect(user).not.toHaveProperty('refreshToken');
  });

  it('nunca expõe o hash da senha', async () => {
    const { createUser } = build();

    const user = await createUser.execute(input);

    expect(user).not.toHaveProperty('passwordHash');
  });

  it('persiste a senha como hash, nunca em claro', async () => {
    const { createUser, users } = build();

    await createUser.execute(input);

    expect(users.users[0]?.passwordHash).not.toBe(input.password);
  });

  it('rejeita e-mail já cadastrado', async () => {
    const { createUser } = build();
    await createUser.execute(input);

    await expect(createUser.execute(input)).rejects.toThrow(AlreadyExistsError);
  });
});
