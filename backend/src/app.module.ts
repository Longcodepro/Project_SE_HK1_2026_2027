import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
