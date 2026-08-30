export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceName: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  deviceName?: string | undefined;
  ipAddress?: string | undefined;
  expiresAt: Date;
}

export abstract class SessionsRepository {
  abstract create(data: CreateSessionData): Promise<Session>;

  /**
   * Busca inclusive sessões já revogadas — é justamente o registro revogado que
   * permite detectar o reuso de um refresh token já consumido.
   */
  abstract findByRefreshTokenHash(hash: string): Promise<Session | null>;

  abstract findActiveByUser(userId: string): Promise<Session[]>;
  abstract findById(id: string): Promise<Session | null>;

  abstract revoke(id: string, at: Date): Promise<void>;
  abstract revokeAllForUser(userId: string, at: Date): Promise<number>;
}
