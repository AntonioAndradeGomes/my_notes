import { z } from 'zod';

/**
 * Contrato das variáveis de ambiente.
 *
 * A validação roda no boot: falta de segredo derruba a aplicação na
 * inicialização, em vez de produzir comportamento estranho horas depois.
 * Ver docs/guides/environment-variables.md.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  API_PORT: z.coerce.number().int().positive().default(3333),
  API_GLOBAL_PREFIX: z.string().default('api'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(z.string().url()).min(1)),

  DATABASE_URL: z.string().url(),

  // Segredos curtos são o elo fraco de qualquer esquema de token.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET precisa de ao menos 32 caracteres'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET precisa de ao menos 32 caracteres'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // Mínimos recomendados pelo OWASP para Argon2id.
  ARGON2_MEMORY_COST: z.coerce.number().int().min(19456).default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().min(2).default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().min(1).default(1),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida o ambiente e reporta **todos** os problemas de uma vez.
 * Corrigir uma variável por execução é um ciclo de feedback ruim.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Configuração de ambiente inválida:\n${issues}\n\n` +
        `Confira o .env contra o .env.example (docs/guides/environment-variables.md).`,
    );
  }

  return result.data;
}
