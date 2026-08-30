import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';

import { type Env, validateEnv } from './env.schema.js';

/**
 * ConfigService tipado: `config.get('API_PORT')` devolve `number`, não
 * `string | undefined`. Nenhum `process.env` deve aparecer fora daqui.
 */
export type TypedConfigService = ConfigService<Env, true>;

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // O .env vive na raiz do monorepo, compartilhado com a web.
      envFilePath: ['../../.env'],
      validate: validateEnv,
      cache: true,
    }),
  ],
})
export class ConfigModule {}
