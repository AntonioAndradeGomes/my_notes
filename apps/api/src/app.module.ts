import { Module } from '@nestjs/common';

import { NotFoundModule } from './common/controllers/not-found.module.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  // NotFoundModule por último: seu curinga casa com qualquer rota, então
  // precisa ser registrado depois de todas as rotas reais.
  imports: [ConfigModule, PrismaModule, AuthModule, UsersModule, HealthModule, NotFoundModule],
})
export class AppModule {}
