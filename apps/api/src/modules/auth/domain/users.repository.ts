import { type User } from './user.entity.js';

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Lança `AlreadyExistsError` se o e-mail já estiver em uso.
   *
   * A checagem é a violação de unicidade do banco, não um SELECT anterior:
   * duas requisições concorrentes passariam pelo SELECT e criariam duas contas.
   */
  abstract create(data: CreateUserData): Promise<User>;

  abstract updateName(id: string, name: string): Promise<User>;
  abstract updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  abstract scheduleDeletion(id: string, scheduledAt: Date): Promise<void>;
}
