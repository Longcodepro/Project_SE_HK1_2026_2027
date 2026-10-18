import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { NewUser, User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { phone } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { email } });
  }

  create(data: NewUser): Promise<User> {
    return this.prisma.db.user.create({ data });
  }

  update(id: number, patch: Parameters<UserRepository['update']>[1]): Promise<User> {
    return this.prisma.db.user.update({ where: { id }, data: patch });
  }
}
