// src/tips/tips.module.ts
import { Module } from '@nestjs/common';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { TipsCronService } from './tips.crone.service';


@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [TipsController],
  providers: [TipsService, TipsCronService],
})
export class TipsModule {}
