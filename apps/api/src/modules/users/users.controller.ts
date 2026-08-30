import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { type PublicUser } from '../auth/domain/user.entity.js';
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type CreateUserInput,
  createUserSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from './dto/users.dto.js';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case.js';
import { CreateUserUseCase } from './use-cases/create-user.use-case.js';
import { GetProfileUseCase } from './use-cases/get-profile.use-case.js';
import { ScheduleAccountDeletionUseCase } from './use-cases/schedule-account-deletion.use-case.js';
import {
  ListSessionsUseCase,
  RevokeSessionUseCase,
  type SessionView,
} from './use-cases/sessions.use-case.js';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case.js';

/**
 * A criação é a única rota pública; todo o resto é escopado em `/users/me`.
 *
 * Não existe `GET /users/{id}`: num app de notas pessoais ninguém administra
 * outra conta, e uma rota que aceita id alheio é superfície de IDOR sem
 * contrapartida de produto.
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly scheduleDeletion: ScheduleAccountDeletionUseCase,
    private readonly listSessions: ListSessionsUseCase,
    private readonly revokeSession: RevokeSessionUseCase,
  ) {}

  /**
   * Cria a conta. **Não devolve tokens**: cadastrar não autentica — o cliente
   * segue para o login. Não há header `Location` porque não existe URL pública
   * para o usuário criado; ele se lê em `GET /users/me`.
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
  ): Promise<PublicUser> {
    return this.createUser.execute(body);
  }

  @Get('me')
  async me(@CurrentUser('id') userId: string): Promise<PublicUser> {
    return this.getProfile.execute(userId);
  }

  @Patch('me')
  async update(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<PublicUser> {
    return this.updateProfile.execute(userId, body);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async password(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
  ): Promise<void> {
    await this.changePassword.execute(userId, body);
  }

  /** 202, não 204: a exclusão é agendada e cancelável por 30 dias. */
  @Delete('me')
  @HttpCode(HttpStatus.ACCEPTED)
  async remove(@CurrentUser('id') userId: string): Promise<{ scheduledAt: string }> {
    const { scheduledAt } = await this.scheduleDeletion.execute(userId);
    return { scheduledAt: scheduledAt.toISOString() };
  }

  @Get('me/sessions')
  async sessions(@CurrentUser('id') userId: string): Promise<{ data: SessionView[] }> {
    return { data: await this.listSessions.execute(userId) };
  }

  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    await this.revokeSession.execute(userId, sessionId);
  }
}
