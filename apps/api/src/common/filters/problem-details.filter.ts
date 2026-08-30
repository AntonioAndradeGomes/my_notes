import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { DomainError } from '../errors/domain.error.js';
import { ValidationFailedError } from '../errors/validation-failed.error.js';
import { type ProblemDetails, problemTypeUri } from '../problem-details.js';

/**
 * Traduz qualquer exceção para `application/problem+json`.
 *
 * Existe desde o primeiro endpoint de propósito: retrofitar formato de erro
 * depois de ter clientes consumindo a API é retrabalho garantido.
 * Ver ADR-0009 e docs/api/errors.md.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.header('x-request-id') ?? undefined;

    const problem = this.toProblem(exception, request.url, requestId);

    if (problem.status >= 500) {
      // Só erro que exige ação humana vai para o nível error.
      this.logger.error(
        { requestId, path: request.url, code: problem.code },
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response
      .status(problem.status)
      .type('application/problem+json')
      .header('X-Request-Id', requestId ?? '')
      .json(problem);
  }

  private toProblem(exception: unknown, instance: string, requestId?: string): ProblemDetails {
    if (exception instanceof DomainError) {
      return {
        type: problemTypeUri(exception.code),
        title: exception.message,
        status: exception.status,
        instance,
        code: exception.code,
        ...(requestId ? { requestId } : {}),
        // Um item por campo: o cliente precisa saber qual destacar.
        ...(exception instanceof ValidationFailedError ? { errors: exception.fields } : {}),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = httpStatusToCode(status);
      return {
        type: problemTypeUri(code),
        title: exception.message,
        status,
        instance,
        code,
        ...(requestId ? { requestId } : {}),
      };
    }

    // Erro inesperado: a mensagem real fica no log, correlacionada pelo
    // requestId. Nunca vaza stack trace, SQL ou nome de tabela na resposta.
    return {
      type: problemTypeUri('INTERNAL_ERROR'),
      title: 'Erro interno',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: this.isProduction
        ? 'Ocorreu um erro inesperado. Informe o requestId ao suporte.'
        : exception instanceof Error
          ? exception.message
          : String(exception),
      instance,
      code: 'INTERNAL_ERROR',
      ...(requestId ? { requestId } : {}),
    };
  }
}

function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'MALFORMED_REQUEST',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'ALREADY_EXISTS',
    413: 'PAYLOAD_TOO_LARGE',
    415: 'UNSUPPORTED_MEDIA_TYPE',
    422: 'VALIDATION_FAILED',
    429: 'RATE_LIMITED',
    503: 'SERVICE_UNAVAILABLE',
    504: 'TIMEOUT',
  };
  return map[status] ?? 'INTERNAL_ERROR';
}
