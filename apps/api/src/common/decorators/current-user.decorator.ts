import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type AuthenticatedUser } from '../guards/jwt-auth.guard.js';

/**
 * Injeta o usuário autenticado no handler.
 *
 * `@CurrentUser() user` devolve o objeto; `@CurrentUser('id') id` devolve só o
 * campo pedido.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      // Só acontece se alguém usar o decorator numa rota @Public.
      throw new Error('@CurrentUser usado em rota sem autenticação');
    }

    return field ? user[field] : user;
  },
);
