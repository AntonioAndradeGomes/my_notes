import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { type Env } from './config/env.schema.js';
import { installPortugueseErrorMap } from './common/validation/zod-error-map.js';

// Antes de qualquer schema ser avaliado — inclusive a validação do ambiente.
installPortugueseErrorMap();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  const globalPrefix = config.get('API_GLOBAL_PREFIX', { infer: true });

  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });

  configureApp(app, {
    globalPrefix,
    isProduction: config.get('NODE_ENV', { infer: true }) === 'production',
  });

  // Encerra conexões (Prisma, filas) antes de o processo morrer.
  app.enableShutdownHooks();

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);

  Logger.log(`API em http://localhost:${port}/${globalPrefix}/v1`, 'Bootstrap');
}

await bootstrap();
