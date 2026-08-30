import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { UsersController } from './users.controller.js';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case.js';
import { CreateUserUseCase } from './use-cases/create-user.use-case.js';
import { GetProfileUseCase } from './use-cases/get-profile.use-case.js';
import { ScheduleAccountDeletionUseCase } from './use-cases/schedule-account-deletion.use-case.js';
import { ListSessionsUseCase, RevokeSessionUseCase } from './use-cases/sessions.use-case.js';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case.js';

@Module({
  // As portas (UsersRepository, SessionsRepository, PasswordHasher) são
  // exportadas pelo AuthModule — uma única ligação porta→adaptador no projeto.
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    ScheduleAccountDeletionUseCase,
    ListSessionsUseCase,
    RevokeSessionUseCase,
  ],
})
export class UsersModule {}
