import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HomeController],
  providers: [HomeService, PrismaService], 
  exports: [HomeService],
})
export class HomeModule {}
