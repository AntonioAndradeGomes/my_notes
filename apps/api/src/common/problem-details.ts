/**
 * Erro no formato `application/problem+json` (RFC 9457).
 * Catálogo de códigos em docs/api/errors.md.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  /** Código estável de máquina. É contra ele que os clientes programam. */
  code: string;
  requestId?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export const PROBLEM_BASE_URI = 'https://docs.mynotes.app/errors';

/** Converte `VALIDATION_FAILED` em `validation-failed` para compor a URI de `type`. */
export function problemTypeUri(code: string): string {
  return `${PROBLEM_BASE_URI}/${code.toLowerCase().replaceAll('_', '-')}`;
}
