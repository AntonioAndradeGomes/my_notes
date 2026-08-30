import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Dispensa a autenticação em uma rota.
 *
 * O guard é global: toda rota nasce protegida. Esquecer este decorator torna a
 * rota inacessível — nunca acidentalmente aberta. O erro cai para o lado seguro.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
