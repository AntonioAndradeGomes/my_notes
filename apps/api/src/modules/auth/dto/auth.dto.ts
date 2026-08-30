import { z } from 'zod';

/**
 * Schemas de entrada das rotas de autenticação.
 *
 * A criação de conta não está aqui: cadastrar é criar um recurso, não
 * autenticar. Ver `modules/users/dto/users.dto.ts`.
 *
 * Espelham `docs/api/openapi.yaml` — o contrato é a fonte da verdade, e estes
 * schemas passarão a ser gerados a partir dele em `@mynotes/contracts`.
 */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
  deviceName: z.string().trim().max(100).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Informe o refresh token'),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Informe o refresh token'),
  allDevices: z.boolean().default(false),
});
export type LogoutInput = z.infer<typeof logoutSchema>;
