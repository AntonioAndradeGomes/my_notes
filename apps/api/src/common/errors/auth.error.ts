import { DomainError } from './domain.error.js';

/**
 * Credenciais inválidas.
 *
 * A mensagem é idêntica para e-mail inexistente e senha errada: distinguir os
 * casos permitiria enumerar quais endereços possuem conta.
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly status = 401;

  constructor() {
    super('E-mail ou senha incorretos');
  }
}

export class UnauthenticatedError extends DomainError {
  readonly code = 'UNAUTHENTICATED';
  readonly status = 401;
}

export class TokenExpiredError extends DomainError {
  readonly code = 'TOKEN_EXPIRED';
  readonly status = 401;

  constructor() {
    super('Access token expirado');
  }
}

/**
 * Refresh token apresentado depois de já ter sido consumido.
 *
 * Significa roubo do token — ou uma corrida de rede. Tratamos os dois do mesmo
 * jeito, derrubando todas as sessões: o custo de um falso positivo (o usuário
 * faz login de novo) é muito menor que o de um falso negativo.
 */
export class RefreshTokenReusedError extends DomainError {
  readonly code = 'REFRESH_TOKEN_REUSED';
  readonly status = 401;

  constructor() {
    super('Sessão encerrada por segurança: o token foi reutilizado');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'TOKEN_INVALID';
  readonly status = 401;

  constructor() {
    super('Refresh token inválido ou expirado');
  }
}
