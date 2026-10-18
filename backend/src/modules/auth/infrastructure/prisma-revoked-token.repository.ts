import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { RevokedTokenRepository } from '../domain/revoked-token.repository';

@Injectable()
export class PrismaRevokedTokenRepository implements RevokedTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async revoke(data: { jti: string; userId: number; expiresAt: Date }) {
    await this.prisma.db.revokedToken.upsert({ where: { jti: data.jti }, create: data, update: {} });
  }

  async isRevoked(jti: string) {
    return (await this.prisma.db.revokedToken.count({ where: { jti } })) > 0;
  }
}
