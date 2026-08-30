import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { type Env } from '../../config/env.schema.js';
import { PrismaClient } from './generated/client.js';

/**
 * Cliente Prisma com ciclo de vida gerenciado pelo Nest.
 *
 * A partir do Prisma 7 a conexão é feita por um driver adapter — o cliente não
 * lê mais a URL do schema.prisma.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) }),
      log:
        config.get('NODE_ENV', { infer: true }) === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado ao PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Sonda usada pelo readiness check. */
  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
