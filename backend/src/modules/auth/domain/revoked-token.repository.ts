export abstract class RevokedTokenRepository {
  abstract revoke(data: { jti: string; userId: number; expiresAt: Date }): Promise<void>;
  abstract isRevoked(jti: string): Promise<boolean>;
}
