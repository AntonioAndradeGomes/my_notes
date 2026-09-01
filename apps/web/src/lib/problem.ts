/**
 * Erro da API no formato `application/problem+json` (RFC 9457).
 *
 * Ver docs/api/errors.md — o campo `code` é estável e é contra ele que
 * programamos; `title` e `detail` são texto para humanos e podem mudar.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  requestId?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(readonly problem: ProblemDetails) {
    super(problem.title);
    this.name = 'ApiError';
  }

  get code(): string {
    return this.problem.code;
  }

  /** Mensagem de produto, mapeada do código. Nunca exibimos `detail` cru. */
  get userMessage(): string {
    return USER_MESSAGES[this.problem.code] ?? 'Algo deu errado. Tente novamente.';
  }
}

const USER_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  VALIDATION_FAILED: 'Confira os campos destacados.',
  ALREADY_EXISTS: 'Já existe uma conta com este e-mail.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um momento e tente de novo.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível.',
  TIMEOUT: 'A requisição demorou demais. Tente novamente.',
};

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'status' in value &&
    typeof (value as ProblemDetails).code === 'string'
  );
}
