import { validateEnv } from './env.schema.js';

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('aplica os padrões quando as variáveis opcionais faltam', () => {
    const env = validateEnv(valid);

    expect(env.API_PORT).toBe(3333);
    expect(env.NODE_ENV).toBe('development');
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000']);
  });

  it('converte API_PORT de string para número', () => {
    expect(validateEnv({ ...valid, API_PORT: '8080' }).API_PORT).toBe(8080);
  });

  it('divide CORS_ORIGINS em lista, ignorando espaços', () => {
    const env = validateEnv({
      ...valid,
      CORS_ORIGINS: 'http://localhost:3000, https://mynotes.app',
    });

    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000', 'https://mynotes.app']);
  });

  it('rejeita segredo curto — o elo fraco de qualquer esquema de token', () => {
    expect(() => validateEnv({ ...valid, JWT_ACCESS_SECRET: 'curto' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('reporta todos os problemas de uma vez, não um por execução', () => {
    try {
      validateEnv({});
      expect.unreachable('deveria ter lançado');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('DATABASE_URL');
      expect(message).toContain('JWT_ACCESS_SECRET');
      expect(message).toContain('JWT_REFRESH_SECRET');
    }
  });
});
