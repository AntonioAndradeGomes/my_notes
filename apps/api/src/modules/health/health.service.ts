import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service.js';

export interface HealthCheck {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'error';
  checks: Record<string, HealthCheck>;
  uptime: number;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthReport> {
    const checks: Record<string, HealthCheck> = {
      database: await this.timed(() => this.prisma.ping()),
    };

    const allUp = Object.values(checks).every((check) => check.status === 'up');

    return {
      status: allUp ? 'ok' : 'error',
      checks,
      uptime: Math.floor(process.uptime()),
    };
  }

  private async timed(probe: () => Promise<unknown>): Promise<HealthCheck> {
    const startedAt = performance.now();
    try {
      await probe();
      return { status: 'up', latencyMs: Math.round(performance.now() - startedAt) };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
