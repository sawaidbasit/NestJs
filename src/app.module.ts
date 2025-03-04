import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HomeController } from './home/home.controller';
import { EmailModule } from './email/email.module';

@Module({
  imports: [AuthModule, PrismaModule, EmailModule],
  controllers: [HomeController], 
})
export class AppModule {}
