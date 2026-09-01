import { createUserSchema } from '../dto/users.dto.js';

const base = { name: 'Fulano da Silva', email: 'fulano@exemplo.com' };

describe('createUserSchema — limite de senha', () => {
  it('aceita exatamente 8 caracteres', () => {
    expect(createUserSchema.safeParse({ ...base, password: 'senha123' }).success).toBe(true);
  });

  it('rejeita 7 caracteres', () => {
    const result = createUserSchema.safeParse({ ...base, password: 'senha12' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('A senha precisa de ao menos 8 caracteres');
  });

  it('rejeita acima de 128 caracteres', () => {
    expect(createUserSchema.safeParse({ ...base, password: 'a'.repeat(129) }).success).toBe(false);
  });

  it('normaliza o e-mail para minúsculas', () => {
    const result = createUserSchema.safeParse({
      ...base,
      email: '  Fulano@Exemplo.COM ',
      password: 'senha123',
    });

    expect(result.data?.email).toBe('fulano@exemplo.com');
  });
});
