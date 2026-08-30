import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';

import { type Env } from '../../config/env.schema.js';
import { PasswordHasher } from '../../modules/auth/domain/password-hasher.js';

/**
 * Argon2id com os parâmetros mínimos recomendados pelo OWASP.
 *
 * Nunca bcrypt em código novo, nunca SHA de qualquer sabor: hash de senha
 * precisa ser deliberadamente caro em memória, não rápido.
 */
@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  // `raw?: false` explicita a sobrecarga que devolve string: sem isso o
  // TypeScript escolhe a que devolve Buffer.
  private readonly options: argon2.HashOptions & { raw?: false };

  constructor(config: ConfigService<Env, true>) {
    super();
    this.options = {
      type: argon2.argon2id,
      memoryCost: config.get('ARGON2_MEMORY_COST', { infer: true }),
      timeCost: config.get('ARGON2_TIME_COST', { infer: true }),
      parallelism: config.get('ARGON2_PARALLELISM', { infer: true }),
    };
  }

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // Hash malformado (registro corrompido, migração de algoritmo) não é
      // motivo para derrubar o login: é apenas uma verificação que falhou.
      return false;
    }
  }
}
