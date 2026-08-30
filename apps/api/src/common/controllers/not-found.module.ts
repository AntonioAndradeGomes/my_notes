import { Module } from '@nestjs/common';

import { NotFoundController } from './not-found.controller.js';

/**
 * Precisa ser o **último** módulo importado no AppModule: o Express casa rotas
 * na ordem de registro, e o curinga deste controller casaria com tudo.
 */
@Module({ controllers: [NotFoundController] })
export class NotFoundModule {}
