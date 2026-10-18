import { Module } from '@nestjs/common';
import { CreateStaffUseCase, GetUserDetailUseCase, ListUsersUseCase, SetUserActiveUseCase } from './application/admin-users.use-cases';
import { ChangePasswordUseCase, GetMeUseCase, UpdateProfileUseCase } from './application/profile.use-cases';
import { PasswordHasher } from './domain/password-hasher';
import { UserRepository } from './domain/user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AdminUsersController } from './presentation/admin-users.controller';
import { UsersController } from './presentation/users.controller';

@Module({
  controllers: [UsersController, AdminUsersController],
  providers: [
    GetMeUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    ListUsersUseCase,
    GetUserDetailUseCase,
    SetUserActiveUseCase,
    CreateStaffUseCase,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
  ],
  exports: [UserRepository, PasswordHasher],
})
export class UsersModule {}
