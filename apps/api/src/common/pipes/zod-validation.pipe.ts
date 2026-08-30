import { Injectable, type PipeTransform } from '@nestjs/common';
import { type ZodType } from 'zod';

import { ValidationFailedError } from '../errors/validation-failed.error.js';

/**
 * Valida a entrada com um schema Zod.
 *
 * A validação do projeto é com Zod, não com class-validator: o mesmo schema
 * é compartilhado com a aplicação web via `@mynotes/contracts` e gerado a partir
 * do OpenAPI. Ver ADR-0007.
 *
 * Uso: `@Body(new ZodValidationPipe(createNoteSchema)) body: CreateNoteInput`
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new ValidationFailedError(
        result.error.issues.map((issue) => ({
          field: issue.path.join('.') || '(raiz)',
          code: issue.code,
          message: issue.message,
        })),
      );
    }

    return result.data;
  }
}
