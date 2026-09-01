/**
 * Base dos erros de domínio.
 *
 * O domínio não conhece HTTP: ele lança estes erros, e o `ProblemDetailsFilter`
 * os traduz para status e corpo `problem+json`.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Recurso inexistente — ou pertencente a outro usuário.
 *
 * Os dois casos respondem 404 de propósito: um 403 confirmaria a existência do
 * recurso a quem não deveria saber dela. Ver docs/architecture/security.md.
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly status = 404;
}

/** Requisição que não chega a ser um documento válido: corpo ausente ou JSON quebrado. */
export class MalformedRequestError extends DomainError {
  readonly code = 'MALFORMED_REQUEST';
  readonly status = 400;
}

export class AlreadyExistsError extends DomainError {
  readonly code = 'ALREADY_EXISTS';
  readonly status = 409;
}

export class VersionConflictError extends DomainError {
  readonly code = 'VERSION_CONFLICT';
  readonly status = 409;
}
