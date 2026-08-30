import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { type Response } from 'express';

import { Public } from '../../common/decorators/public.decorator.js';
import { HealthService } from './health.service.js';

/**
 * Sondas de liveness e readiness.
 *
 * Contrato em docs/api/openapi.yaml (`/health/live`, `/health/ready`).
 */
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** O processo está de pé. Não toca em dependências de propósito: se o banco
   *  cair, o orquestrador não deve reiniciar a aplicação — ela está viva. */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Verifica as dependências. É esta sonda que o balanceador consulta. */
  @Get('ready')
  async ready(@Res() response: Response): Promise<void> {
    const report = await this.health.check();
    const status = report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    response.status(status).json(report);
  }
}
