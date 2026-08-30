/**
 * Usuário como o domínio o conhece.
 *
 * Não é o modelo do Prisma: os casos de uso não devem depender do ORM. O
 * repositório traduz entre os dois.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  deletionScheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Projeção segura para respostas HTTP: sem `passwordHash`, nunca. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
