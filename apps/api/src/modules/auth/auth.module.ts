import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Argon2PasswordHasher } from '../../infra/crypto/argon2-password-hasher.js';
import { PrismaSessionsRepository } from '../../infra/prisma/prisma-sessions.repository.js';
import { PrismaUsersRepository } from '../../infra/prisma/prisma-users.repository.js';
import { AuthController } from './auth.controller.js';
import { PasswordHasher } from './domain/password-hasher.js';
import { SessionsRepository } from './domain/sessions.repository.js';
import { TokenService } from './domain/token.service.js';
import { UsersRepository } from './domain/users.repository.js';
import { LoginUseCase } from './use-cases/login.use-case.js';
import { LogoutUseCase } from './use-cases/logout.use-case.js';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case.js';
import { SessionIssuer } from './use-cases/session-issuer.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    // Portas do domínio ligadas aos adaptadores de infraestrutura. É esta
    // indireção que permite testar os casos de uso sem banco.
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    { provide: SessionsRepository, useClass: PrismaSessionsRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },

    TokenService,
    SessionIssuer,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,

    // Guard global: toda rota nasce protegida; abrir exige @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [UsersRepository, SessionsRepository, PasswordHasher, TokenService],
})
export class AuthModule {}
