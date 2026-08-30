import { Injectable } from '@nestjs/common';

import { type PublicUser, toPublicUser } from '../../auth/domain/user.entity.js';
import { UsersRepository } from '../../auth/domain/users.repository.js';
import { type UpdateProfileInput } from '../dto/users.dto.js';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    return toPublicUser(await this.users.updateName(userId, input.name));
  }
}
