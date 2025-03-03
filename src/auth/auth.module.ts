import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],   // PrismaModule ensure karein ke import ho
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
