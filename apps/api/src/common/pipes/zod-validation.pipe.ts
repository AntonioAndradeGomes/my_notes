import { Injectable, type PipeTransform } from '@nestjs/common';
import { type ZodType } from 'zod';

import { MalformedRequestError } from '../errors/domain.error.js';
import { ValidationFailedError } from '../errors/validation-failed.error.js';

/**
 * Identifica o corpo da requisição como um todo nos erros de validação.
 *
 * Erros de campo usam notação de ponto (`preferences.theme`); quando o problema
 * é o corpo inteiro, o cliente precisa de um valor estável para exibir — e não
 * de um marcador inventado.
 */
const ROOT_FIELD = 'body';

/**
 * Valida a entrada com um schema Zod.
 *
 * A validação do projeto é com Zod, não com class-validator: o mesmo schema é
 * compartilhado com a aplicação web via `@mynotes/contracts` e gerado a partir
 * do OpenAPI. Ver ADR-0007.
 *
 * Uso: `@Body(new ZodValidationPipe(createNoteSchema)) body: CreateNoteInput`
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    // Corpo ausente não é falha de validação: não há documento para validar.
    // Um 422 aqui sugeriria que o conteúdo enviado violou uma regra.
    if (value === undefined || value === null) {
      throw new MalformedRequestError(
        'O corpo da requisição é obrigatório. Envie JSON com o cabeçalho Content-Type: application/json.',
      );
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new ValidationFailedError(
        result.error.issues.map((issue) => ({
          field: issue.path.length > 0 ? issue.path.join('.') : ROOT_FIELD,
          code: issue.code,
          message: issue.message,
        })),
      );
    }

    return result.data;
  }
}
