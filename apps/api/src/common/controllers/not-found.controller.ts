import { All, Controller, VERSION_NEUTRAL } from '@nestjs/common';

import { Public } from '../decorators/public.decorator.js';
import { NotFoundError } from '../errors/domain.error.js';

/**
 * Captura qualquer rota não mapeada sob o prefixo da API.
 *
 * Sem ele, o Express responde o 404 padrão em HTML — e um cliente que erra a URL
 * recebe uma página em vez do `problem+json` que o contrato promete.
 * Precisa ser o último controller registrado.
 */
// Público: uma URL inexistente deve responder 404, não 401. Exigir token para
// descobrir que a rota não existe apenas confunde quem está integrando.
@Public()
@Controller({ path: '*path', version: VERSION_NEUTRAL })
export class NotFoundController {
  @All()
  handle(): never {
    throw new NotFoundError('Rota não encontrada');
  }
}
