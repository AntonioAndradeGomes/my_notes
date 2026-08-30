import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { type Env } from '../../../config/env.schema.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshToken {
  /** Valor entregue ao cliente. Nunca é persistido. */
  token: string;
  /** SHA-256 do valor acima. É isto que vai para o banco. */
  hash: string;
}

/**
 * Emissão e verificação dos dois tokens.
 *
 * São de naturezas diferentes de propósito:
 *
 * - **Access**: JWT assinado, curto, sem estado — validado sem tocar o banco.
 * - **Refresh**: valor opaco e aleatório, com hash no banco. Não é JWT porque um
 *   JWT continuaria válido depois de revogado, a menos que se mantivesse uma
 *   denylist — que já é estado no servidor. Sendo assim, é melhor que o token
 *   seja opaco desde o início.
 *
 * Ver ADR-0004 e docs/architecture/security.md.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  /** 256 bits de entropia criptográfica. */
  issueRefreshToken(): RefreshToken {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Comparação em tempo constante, para não vazar informação por timing. */
  refreshTokenMatches(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashRefreshToken(token), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  /** Validade do access token em segundos — vai no campo `expiresIn` da resposta. */
  accessTokenTtlSeconds(): number {
    return parseDuration(this.config.get('JWT_ACCESS_TTL', { infer: true }));
  }

  refreshTokenExpiresAt(): Date {
    const ttl = parseDuration(this.config.get('JWT_REFRESH_TTL', { infer: true }));
    return new Date(Date.now() + ttl * 1000);
  }
}

const UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

/** Converte `15m`, `30d`, `3600` em segundos. */
export function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Duração inválida: "${value}". Use formatos como 15m, 24h ou 30d.`);
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  return amount * (UNITS[unit] ?? 1);
}
