import { randomUUID } from 'node:crypto';

import { PasswordHasher } from '../../src/modules/auth/domain/password-hasher.js';
import {
  type CreateSessionData,
  type Session,
  SessionsRepository,
} from '../../src/modules/auth/domain/sessions.repository.js';
import { type User } from '../../src/modules/auth/domain/user.entity.js';
import {
  type CreateUserData,
  UsersRepository,
} from '../../src/modules/auth/domain/users.repository.js';
import { AlreadyExistsError } from '../../src/common/errors/domain.error.js';

/**
 * Implementações em memória das portas do domínio.
 *
 * É isto que a indireção porta/adaptador compra: os casos de uso rodam em
 * milissegundos, sem Docker e sem banco.
 */
export class InMemoryUsersRepository extends UsersRepository {
  readonly users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Espelha o comportamento do citext no banco.
    const target = email.toLowerCase();
    return this.users.find((user) => user.email.toLowerCase() === target) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    if (await this.findByEmail(data.email)) {
      throw new AlreadyExistsError('Já existe uma conta com este e-mail');
    }

    const user: User = {
      id: randomUUID(),
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      deletionScheduledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateName(id: string, name: string): Promise<User> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) throw new Error('usuário inexistente no repositório de teste');
    user.name = name;
    user.updatedAt = new Date();
    return user;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (user) user.passwordHash = passwordHash;
  }

  async scheduleDeletion(id: string, scheduledAt: Date): Promise<void> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (user) user.deletionScheduledAt = scheduledAt;
  }
}

export class InMemorySessionsRepository extends SessionsRepository {
  readonly sessions: Session[] = [];

  async create(data: CreateSessionData): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      deviceName: data.deviceName ?? null,
      ipAddress: data.ipAddress ?? null,
      expiresAt: data.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.sessions.push(session);
    return session;
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    return this.sessions.find((session) => session.refreshTokenHash === hash) ?? null;
  }

  async findById(id: string): Promise<Session | null> {
    return this.sessions.find((session) => session.id === id) ?? null;
  }

  async findActiveByUser(userId: string): Promise<Session[]> {
    const now = Date.now();
    return this.sessions.filter(
      (session) =>
        session.userId === userId && !session.revokedAt && session.expiresAt.getTime() > now,
    );
  }

  async revoke(id: string, at: Date): Promise<void> {
    const session = this.sessions.find((candidate) => candidate.id === id);
    if (session && !session.revokedAt) session.revokedAt = at;
  }

  async revokeAllForUser(userId: string, at: Date): Promise<number> {
    let count = 0;
    for (const session of this.sessions) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = at;
        count += 1;
      }
    }
    return count;
  }
}

/** Hasher determinístico e instantâneo — Argon2 real deixaria a suíte lenta. */
export class FakePasswordHasher extends PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
