import { ApiError, isProblemDetails, type ProblemDetails } from './problem';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3333/api/v1';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken?: string | undefined;
  signal?: AbortSignal | undefined;
}

/**
 * Cliente HTTP da API.
 *
 * Traduz `problem+json` em `ApiError` — quem chama trata um erro tipado, não um
 * `Response` cru com status para inspecionar.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken, signal } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      isProblemDetails(payload)
        ? payload
        : ({
            type: 'about:blank',
            title: 'Erro inesperado',
            status: response.status,
            code: 'INTERNAL_ERROR',
          } satisfies ProblemDetails),
    );
  }

  return payload as T;
}
