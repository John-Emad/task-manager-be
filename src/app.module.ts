import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, TaskModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
