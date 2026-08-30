import { Injectable } from '@nestjs/common';

import { AlreadyExistsError } from '../../common/errors/domain.error.js';
import { type User } from '../../modules/auth/domain/user.entity.js';
import {
  type CreateUserData,
  UsersRepository,
} from '../../modules/auth/domain/users.repository.js';
import { PrismaService } from './prisma.service.js';

/** Código do Postgres para violação de unicidade, repassado pelo Prisma. */
const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    // A coluna é citext: a comparação já ignora maiúsculas/minúsculas.
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      // Deixamos o banco decidir: um SELECT antes do INSERT deixaria uma janela
      // em que duas requisições concorrentes criariam a mesma conta.
      if (isUniqueViolation(error)) {
        throw new AlreadyExistsError('Já existe uma conta com este e-mail');
      }
      throw error;
    }
  }

  async updateName(id: string, name: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { name } });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async scheduleDeletion(id: string, scheduledAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletionScheduledAt: scheduledAt },
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION
  );
}
