import 'server-only';

import { cookies } from 'next/headers';

/**
 * Sessão em cookies `httpOnly`.
 *
 * O refresh token nunca é acessível ao JavaScript do navegador: um XSS não o
 * alcança. É a razão de a aplicação web falar com a API através de route
 * handlers do próprio Next em vez de chamá-la direto do cliente — ver ADR-0005.
 */
const ACCESS_COOKIE = 'mynotes_access';
const REFRESH_COOKIE = 'mynotes_refresh';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function createSession(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  store.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: tokens.expiresIn,
  });

  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    // 30 dias, alinhado ao JWT_REFRESH_TTL da API.
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
