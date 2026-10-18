import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { OtpPurpose, OtpRecord } from '../domain/otp';
import { OtpRepository } from '../domain/otp.repository';

@Injectable()
export class PrismaOtpRepository implements OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { phone: string; purpose: OtpPurpose; codeHash: string; expiresAt: Date }) {
    await this.prisma.db.otpCode.create({ data });
  }

  findLatest(phone: string, purpose: OtpPurpose): Promise<OtpRecord | null> {
    return this.prisma.db.otpCode.findFirst({ where: { phone, purpose }, orderBy: { id: 'desc' } });
  }

  async increaseAttempts(id: number) {
    await this.prisma.db.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  async consume(id: number, at: Date) {
    await this.prisma.db.otpCode.update({ where: { id }, data: { consumedAt: at } });
  }
}
