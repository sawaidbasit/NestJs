import { Module } from '@nestjs/common';
import { MaterialsController } from './material.controller';
import { MaterialsService } from './material.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MaterialsController],
  providers: [MaterialsService, PrismaService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
