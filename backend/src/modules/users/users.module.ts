import { Module } from '@nestjs/common';
import { PasswordHasher } from './domain/password-hasher';
import { UserRepository } from './domain/user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
  ],
  exports: [UserRepository, PasswordHasher],
})
export class UsersModule {}
