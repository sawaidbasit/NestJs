// image-analysis.module.ts
import { Module } from '@nestjs/common';
import { ImageAnalysisService } from './image-analysis.service';
import { PrismaModule } from '../prisma/prisma.module'; // Make sure PrismaModule is imported

@Module({
  imports: [PrismaModule], // PrismaModule should be imported
  providers: [ImageAnalysisService],
  exports: [ImageAnalysisService],
})
export class ImageAnalysisModule {}
