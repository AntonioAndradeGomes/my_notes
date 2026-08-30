import { type FieldError } from '../problem-details.js';
import { DomainError } from './domain.error.js';

/**
 * Entrada sintaticamente válida, mas semanticamente inválida.
 *
 * Carrega um erro por campo — o cliente precisa saber *qual* campo destacar,
 * não apenas que "algo deu errado". Ver docs/api/errors.md.
 */
export class ValidationFailedError extends DomainError {
  readonly code = 'VALIDATION_FAILED';
  readonly status = 422;

  constructor(readonly fields: FieldError[]) {
    super('Falha de validação');
  }
}
