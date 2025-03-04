import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [AuthService, PrismaService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
