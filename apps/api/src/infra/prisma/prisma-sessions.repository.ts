import { Injectable } from '@nestjs/common';

import {
  type CreateSessionData,
  type Session,
  SessionsRepository,
} from '../../modules/auth/domain/sessions.repository.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class PrismaSessionsRepository extends SessionsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateSessionData): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        deviceName: data.deviceName ?? null,
        ipAddress: data.ipAddress ?? null,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    // Sem filtrar por revokedAt: a sessão revogada é o que denuncia o reuso.
    return this.prisma.session.findUnique({ where: { refreshTokenHash: hash } });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findActiveByUser(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: at },
    });
  }

  async revokeAllForUser(userId: string, at: Date): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: at },
    });
    return result.count;
  }
}
