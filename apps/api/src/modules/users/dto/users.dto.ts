import { z } from 'zod';

/**
 * Mínimo de 8 caracteres — o piso absoluto recomendado pelo OWASP.
 *
 * Não exigimos combinação de tipos de caractere: a evidência é que essa regra
 * produz senhas piores, não melhores. Com o piso em 8 em vez de 12, a checagem
 * contra listas de senhas vazadas passa a ser a defesa principal contra senhas
 * triviais — ver docs/architecture/security.md.
 */
const password = z
  .string()
  .min(8, 'A senha precisa de ao menos 8 caracteres')
  .max(128, 'A senha excede o tamanho máximo de 128 caracteres');

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome completo').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(255),
  password,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Só o nome é editável na v1. Avatar e preferências entram depois, como campos
 * opcionais — mudança retrocompatível pelas regras da ADR-0008.
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome completo').max(120),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: password,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
