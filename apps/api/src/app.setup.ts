import { type INestApplication, VersioningType } from '@nestjs/common';

import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';

export interface AppSetupOptions {
  globalPrefix: string;
  isProduction: boolean;
}

/**
 * Configuração compartilhada entre o bootstrap real e os testes e2e.
 *
 * Existe para que o que os testes exercitam seja o que roda em produção: com a
 * configuração duplicada, um filtro registrado só no main.ts passaria despercebido
 * pela suíte.
 */
export function configureApp(app: INestApplication, options: AppSetupOptions): void {
  app.setGlobalPrefix(options.globalPrefix);

  // Versionamento por caminho de URL: /api/v1/... — ver ADR-0008.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Não há ValidationPipe global: a validação é por schema Zod, aplicada por
  // rota com ZodValidationPipe. Ver src/common/pipes/zod-validation.pipe.ts.
  // Todo erro sai em application/problem+json — ver ADR-0009.
  app.useGlobalFilters(new ProblemDetailsFilter(options.isProduction));
}
